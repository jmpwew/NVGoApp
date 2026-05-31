const pool = require('../config/db');

// Returns notifications for the logged-in user:
// their own (user_id = me) + broadcasts (user_id IS NULL)
exports.getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE user_id = $1 OR user_id IS NULL`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error marking all as read' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM notifications
       WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};


exports.savePushToken = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { push_token } = req.body;

    await pool.query(
      'UPDATE users SET push_token = $1 WHERE id = $2',
      [push_token, user_id]
    );

    res.json({ message: 'Push token saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};