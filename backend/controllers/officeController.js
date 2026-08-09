const pool = require('../config/db');
const sendPushNotification = require('../utils/sendPushNotification');
const { createAlert } = require('./alertController');

const OFFICE_LABELS = { police: 'Police', bfp: 'BFP (Fire)', medical: 'Medical / Ambulance' };
const STATUS_LABELS = { ongoing: 'Ongoing', dispatched: 'Unit Dispatched', resolved: 'Resolved' };

// Inserts an in-app notification for the citizen and pushes it to their
// device (if they have a push token on file). Used for both the
// "unit dispatched" and "report resolved" moments below.
async function notifyCitizen(user_id, title, body) {
  if (!user_id) return;

  await pool.query(
    `INSERT INTO notifications (user_id, title, body, type)
     VALUES ($1, $2, $3, $4)`,
    [user_id, title, body, 'update']
  ).catch(err => console.error(`insert notification (${title}) failed:`, err));

  const tokenResult = await pool.query('SELECT push_token FROM users WHERE id = $1', [user_id]);
  const pushToken = tokenResult.rows[0]?.push_token;
  if (pushToken) {
    await sendPushNotification([pushToken], title, body);
  }
}

// Reports assigned to the logged-in office (req.user.role = 'police' | 'bfp' | 'medical')
exports.getMyAssignments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         a.id            AS assignment_id,
         a.status        AS assignment_status,
         a.action_note,
         a.assigned_at,
         a.updated_at,
         r.*,
         u.firstname,
         u.lastname
       FROM report_assignments a
       JOIN reports r ON r.id = a.report_id
       LEFT JOIN users u ON r.user_id = u.id
       WHERE a.office_role = $1
       ORDER BY a.assigned_at DESC`,
      [req.user.role]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching assignments' });
  }
};

// Update this office's own status/action note for a given assignment.
// An office can only touch its OWN assignment row (enforced by office_role match).
exports.updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { status, action_note } = req.body;

    if (status && !['ongoing', 'dispatched', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const result = await pool.query(
      `UPDATE report_assignments
       SET status = COALESCE($1, status),
           action_note = COALESCE($2, action_note),
           updated_at = NOW()
       WHERE id = $3 AND office_role = $4
       RETURNING *`,
      [status || null, action_note ?? null, assignmentId, req.user.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found for your office.' });
    }

    const assignment = result.rows[0];

    // let the main Admin know this office touched their assignment on this report
    const officeLabel = OFFICE_LABELS[req.user.role] || req.user.role;
    let updateDetail;
    if (status && action_note) {
      updateDetail = `Status: ${STATUS_LABELS[status] || status} — note updated`;
    } else if (status) {
      updateDetail = `Status changed to ${STATUS_LABELS[status] || status}`;
    } else if (action_note) {
      updateDetail = 'Action note updated';
    }
    createAlert({
      type: 'office',
      related_id: assignment.report_id,
      title: `${officeLabel} updated a report`,
      detail: updateDetail,
      target_role: 'admin',
    }).catch(err => console.error('createAlert (office) failed:', err));

    // Let the citizen know as soon as a unit is dispatched to their report —
    // don't make them wait until every assigned office resolves.
    if (status === 'dispatched') {
      const reportResult = await pool.query(
        'SELECT user_id FROM reports WHERE id = $1',
        [assignment.report_id]
      );
      const reportUserId = reportResult.rows[0]?.user_id;
      notifyCitizen(
        reportUserId,
        'Unit Dispatched',
        `A ${officeLabel} unit has been dispatched to your report.`
      ).catch(err => console.error('notifyCitizen (dispatched) failed:', err));
    }

    // if ALL offices assigned to this report are now resolved, mark the report itself resolved
    const remaining = await pool.query(
      `SELECT COUNT(*) FROM report_assignments WHERE report_id = $1 AND status != 'resolved'`,
      [assignment.report_id]
    );
    if (parseInt(remaining.rows[0].count) === 0) {
      const reportResult = await pool.query(
        `UPDATE reports SET status = 'resolved' WHERE id = $1 RETURNING *`,
        [assignment.report_id]
      );
      const report = reportResult.rows[0];
      if (report?.user_id) {
        await notifyCitizen(
          report.user_id,
          'Report Resolved',
          'Your report has been resolved. Thank you for helping keep the community safe.'
        );
      }
    }

    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating assignment' });
  }
};