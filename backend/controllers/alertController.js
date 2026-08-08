const pool = require('../config/db');

// GET /api/admin/alerts
// Latest notifications for the caller's OWN role's bell dropdown
// (read + unread), newest first.
exports.getFeed = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const result = await pool.query(
      `SELECT id, type, related_id, title, detail, is_read, created_at
       FROM admin_notifications
       WHERE target_role = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.user.role, limit]
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
      `SELECT COUNT(*) FROM admin_notifications WHERE target_role = $1 AND is_read = FALSE`,
      [req.user.role]
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
      `UPDATE admin_notifications SET is_read = TRUE WHERE id = $1 AND target_role = $2 RETURNING *`,
      [req.params.id, req.user.role]
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
    await pool.query(
      `UPDATE admin_notifications SET is_read = TRUE WHERE is_read = FALSE AND target_role = $1`,
      [req.user.role]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error marking all alerts as read' });
  }
};

// DELETE /api/admin/alerts/:id
exports.deleteAlert = async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM admin_notifications WHERE id = $1 AND target_role = $2`,
      [req.params.id, req.user.role]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting alert' });
  }
};

// Helper used by other controllers to create a bell notification.
// (Not an HTTP handler — imported directly.)
// target_role: which role's bell this shows up in —
// 'admin' | 'verifier' | 'police' | 'bfp' | 'medical'. Defaults to 'admin'
// to match existing behavior for callers that don't specify one.
exports.createAlert = async ({ type, related_id, title, detail, target_role = 'admin' }) => {
  await pool.query(
    `INSERT INTO admin_notifications (type, related_id, title, detail, target_role)
     VALUES ($1, $2, $3, $4, $5)`,
    [type, related_id || null, title, detail || null, target_role]
  );
};