const pool = require('../config/db');
const sendPushNotification = require('../utils/sendPushNotification');
const { createAlert } = require('./alertController');
const { uploadManyToSupabase } = require('../utils/uploadToSupabase');

exports.createReport = async (req, res) => {
  try {
    const user_id = req.user?.id || null;
    const { name, contact, description, latitude, longitude, location_note } = req.body;

    // Limit logged-in accounts to 5 reports
    if (user_id) {
      const todayCount = await pool.query(
        `SELECT COUNT(*) FROM reports
         WHERE user_id = $1 AND created_at >= date_trunc('day', NOW())`,
        [user_id]
      );
      if (parseInt(todayCount.rows[0].count) >= 5) {
        return res.status(429).json({
          message: "You've reached the maximum of 5 reports for today. Please try again tomorrow."
        });
      }
    }

    const images = await uploadManyToSupabase(req.files?.images, 'report-images');
    const videos = await uploadManyToSupabase(req.files?.videos, 'report-videos');

    const result = await pool.query(
      `INSERT INTO reports (user_id, name, contact, description, latitude, longitude, images, videos, location_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user_id, name, contact, description, latitude, longitude, images, videos, location_note]
    );

    const newReport = result.rows[0];

    
    createAlert({
      type: 'report',
      related_id: newReport.id,
      title: 'New report submitted',
      detail: name ? `From ${name}` : (description ? description.slice(0, 60) : ''),
    }).catch(err => console.error('createAlert (report) failed:', err));

    createAlert({
      type: 'report',
      related_id: newReport.id,
      title: 'New report to verify',
      detail: name ? `From ${name}` : (description ? description.slice(0, 60) : ''),
      target_role: 'verifier',
    }).catch(err => console.error('createAlert (report, verifier) failed:', err));

    // only send notification if logged-in user (guests have no push token)
    if (user_id) {
      // save to the user's in-app notification history
      await pool.query(
        `INSERT INTO notifications (user_id, title, body, type)
         VALUES ($1, $2, $3, $4)`,
        [
          user_id,
          'Report Submitted',
          'Your report has been received. We will review it shortly.',
          'report',
        ]
      ).catch(err => console.error('insert notification (report submitted) failed:', err));

      const tokenResult = await pool.query(
        'SELECT push_token FROM users WHERE id = $1',
        [user_id]
      );
      const pushToken = tokenResult.rows[0]?.push_token;
      if (pushToken) {
        await sendPushNotification(
          [pushToken],
          'Report Submitted',
          'Your report has been received. We will review it shortly.'
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving report' });
  }
};

exports.getReportsByUser = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};