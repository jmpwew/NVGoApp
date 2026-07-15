const pool = require('../config/db');
const sendPushNotification = require('../utils/sendPushNotification');
const { createAlert } = require('./alertController');

exports.createReport = async (req, res) => {
  try {
    const user_id = req.user?.id || null;
    const { name, contact, description, latitude, longitude, location_note } = req.body;

    const images = req.files
      ? req.files.map(file => file.filename)
      : [];

    const result = await pool.query(
      `INSERT INTO reports (user_id, name, contact, description, latitude, longitude, images, location_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user_id, name, contact, description, latitude, longitude, images, location_note]
    );

    const newReport = result.rows[0];

    // fire-and-forget: don't let a bell-notification failure break report submission
    createAlert({
      type: 'report',
      related_id: newReport.id,
      title: 'New report submitted',
      detail: name ? `From ${name}` : (description ? description.slice(0, 60) : ''),
    }).catch(err => console.error('createAlert (report) failed:', err));

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
          '✅ Report Submitted',
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