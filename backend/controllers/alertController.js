const pool = require('../config/db');

// GET /api/admin/alerts
// Latest notifications for the admin bell dropdown (read + unread), newest first.
exports.getFeed = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const result = await pool.query(
      `SELECT id, type, related_id, title, detail, is_read, created_at
       FROM admin_notifications
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
};

// GET /api/admin/alerts/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM admin_notifications WHERE is_read = FALSE`
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
};

// PATCH /api/admin/alerts/:id/read
exports.markRead = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE admin_notifications SET is_read = TRUE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: 'Alert not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error marking alert as read' });
  }
};

// PATCH /api/admin/alerts/read-all
exports.markAllRead = async (req, res) => {
  try {
    await pool.query(`UPDATE admin_notifications SET is_read = TRUE WHERE is_read = FALSE`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error marking all alerts as read' });
  }
};

// DELETE /api/admin/alerts/:id
exports.deleteAlert = async (req, res) => {
  try {
    await pool.query(`DELETE FROM admin_notifications WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting alert' });
  }
};

// Helper used by other controllers to create a bell notification.
// (Not an HTTP handler — imported directly.)
exports.createAlert = async ({ type, related_id, title, detail }) => {
  await pool.query(
    `INSERT INTO admin_notifications (type, related_id, title, detail)
     VALUES ($1, $2, $3, $4)`,
    [type, related_id || null, title, detail || null]
  );
};
