// backend/routes/notificationRoutes.js
// Mobile-facing notification endpoints (user must be logged in)

const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

// ── Auth middleware ──────────────────────────────────────────
function verifyUser(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}


//    Returns notifications for the logged-in user:
//    their own (user_id = me) + broadcasts (user_id IS NULL)
router.get('/', verifyUser, async (req, res) => {
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
});

// ── PATCH /api/notifications/:id/read
//    Mark a single notification as read
router.patch('/:id/read', verifyUser, async (req, res) => {
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
});

// ── PATCH /api/notifications/read-all
//    Mark all of this user's notifications as read
router.patch('/read-all', verifyUser, async (req, res) => {
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
});

// ── DELETE /api/notifications/:id
//    Delete a notification (only the owner's or a broadcast copy)
router.delete('/:id', verifyUser, async (req, res) => {
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
});

module.exports = router;