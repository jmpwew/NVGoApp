const pool = require('../config/db');
const sendPushNotification = require('../utils/sendPushNotification');
const { createAlert } = require('./alertController');
const { REPORT_TYPE_VALUES, REPORT_TYPE_LABELS } = require('../utils/reportTypes');

// Reports that still need to be reviewed by a verifier

exports.getPendingReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.firstname, u.lastname
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.verified_by IS NULL
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching pending reports' });
  }
};

// Reports this verifier has already reviewed (for their own history view)
exports.getVerifiedReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.firstname, u.lastname,
              COALESCE(
                array_agg(DISTINCT ra.office_role) FILTER (WHERE ra.office_role IS NOT NULL),
                '{}'
              ) AS office_roles
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN report_assignments ra ON ra.report_id = r.id
       WHERE r.verified_by = $1
       GROUP BY r.id, u.firstname, u.lastname
       ORDER BY r.verified_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching verified reports' });
  }
};

// Verify a report and assign it to one or more offices in one action.

exports.verifyAndAssign = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { officeRoles, reportType } = req.body;
    const validRoles = ['police', 'bfp', 'medical'];

    if (!Array.isArray(officeRoles) || officeRoles.length === 0) {
      return res.status(400).json({ message: 'Select at least one office.' });
    }
    if (officeRoles.some(r => !validRoles.includes(r))) {
      return res.status(400).json({ message: 'Invalid office selected.' });
    }
    if (!reportType || !REPORT_TYPE_VALUES.includes(reportType)) {
      return res.status(400).json({ message: 'Select a report type.' });
    }

    await client.query('BEGIN');

    // mark report as verified, tag its incident type, move to ongoing
    const reportResult = await client.query(
      `UPDATE reports
       SET verified_by = $1, verified_at = NOW(), status = 'ongoing', report_type = $3
       WHERE id = $2
       RETURNING *`,
      [req.user.id, id, reportType]
    );

    if (reportResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Report not found.' });
    }

    // create one assignment row per selected office
    const assignments = [];
    for (const officeRole of officeRoles) {
      const a = await client.query(
        `INSERT INTO report_assignments (report_id, office_role, status)
         VALUES ($1, $2, 'ongoing')
         RETURNING *`,
        [id, officeRole]
      );
      assignments.push(a.rows[0]);
    }

    await client.query('COMMIT');

    // let each assigned office know a new case has landed on their desk
    for (const officeRole of officeRoles) {
      createAlert({
        type: 'assignment',
        related_id: id,
        title: 'New report assigned to your office',
        detail: reportResult.rows[0].description ? reportResult.rows[0].description.slice(0, 60) : '',
        target_role: officeRole,
      }).catch(err => console.error('createAlert (assignment) failed:', err));
    }

    // notify the reporter their report was verified/turned over
    const report = reportResult.rows[0];
    if (report.user_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, body, type)
         VALUES ($1, $2, $3, $4)`,
        [
          report.user_id,
          'Report Verified',
          `Your report (${REPORT_TYPE_LABELS[reportType] || reportType}) has been verified and forwarded to: ${officeRoles.join(', ').toUpperCase()}.`,
          'update',
        ]
      ).catch(err => console.error('insert notification (verify) failed:', err));

      const tokenResult = await pool.query('SELECT push_token FROM users WHERE id = $1', [report.user_id]);
      const pushToken = tokenResult.rows[0]?.push_token;
      if (pushToken) {
        await sendPushNotification([pushToken], 'Report Verified', 'Your report has been forwarded to the concerned office(s).');
      }
    }

    res.json({ report, assignments });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Error verifying report' });
  } finally {
    client.release();
  }
};