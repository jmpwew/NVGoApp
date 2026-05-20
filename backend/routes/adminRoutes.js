const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const upload = require('../config/multer');
const router = express.Router();

// Middleware - checks if the user is an admin
function verifyAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// GET dashboard stats
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const totalReports    = await pool.query('SELECT COUNT(*) FROM reports');
    const pendingReports  = await pool.query("SELECT COUNT(*) FROM reports WHERE status = 'pending'");
    const resolvedReports = await pool.query("SELECT COUNT(*) FROM reports WHERE status = 'resolved'");
    const totalUsers      = await pool.query('SELECT COUNT(*) FROM users');
    const totalNews       = await pool.query('SELECT COUNT(*) FROM news');

    res.json({
      totalReports:    parseInt(totalReports.rows[0].count),
      pendingReports:  parseInt(pendingReports.rows[0].count),
      resolvedReports: parseInt(resolvedReports.rows[0].count),
      totalUsers:      parseInt(totalUsers.rows[0].count),
      totalNews:       parseInt(totalNews.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// GET all reports
router.get('/reports', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.firstname, u.lastname
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// UPDATE report status
router.put('/reports/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE reports SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating report' });
  }
});

// DELETE report
router.delete('/reports/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting report' });
  }
});

// GET all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, firstname, lastname, email, contact, address, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// DELETE user
router.delete('/users/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// GET all news
router.get('/news', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching news' });
  }
});

// CREATE news
router.post('/news', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const image = req.file ? req.file.filename : null;
    const result = await pool.query(
      `INSERT INTO news (title, content, category, image, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, content, category || 'announcement', image, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating news' });
  }
});

// UPDATE news
router.put('/news/:id', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const image = req.file ? req.file.filename : null;

    const result = image
      ? await pool.query(
          'UPDATE news SET title=$1, content=$2, category=$3, image=$4 WHERE id=$5 RETURNING *',
          [title, content, category, image, req.params.id]
        )
      : await pool.query(
          'UPDATE news SET title=$1, content=$2, category=$3 WHERE id=$4 RETURNING *',
          [title, content, category, req.params.id]
        );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating news' });
  }
});

// DELETE news
router.delete('/news/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM news WHERE id = $1', [req.params.id]);
    res.json({ message: 'News deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting news' });
  }

});


// GET /api/admin/notifications  — list all notifications (admin view)
router.get('/notifications', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, u.firstname, u.lastname
       FROM notifications n
       LEFT JOIN users u ON n.user_id = u.id
       ORDER BY n.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// POST /api/admin/notifications  — send a notification
//   Body: { title, body, type, user_id }
//   Leave user_id empty / null to broadcast to ALL users
router.post('/notifications', verifyAdmin, async (req, res) => {
  try {
    const { title, body, type = 'info', user_id } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, body, type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id || null, title, body, type]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending notification' });
  }
});

// DELETE /api/admin/notifications/:id  — delete any notification
router.delete('/notifications/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

// GET /api/admin/support  — list all support messages
router.get('/support', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM support_messages ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching support messages' });
  }
});
 
// PATCH /api/admin/support/:id/read  — mark a message as read
router.patch('/support/:id/read', verifyAdmin, async (req, res) => {
  try {
    await pool.query(
      'UPDATE support_messages SET is_read = TRUE WHERE id = $1',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating message' });
  }
});
 
// DELETE /api/admin/support/:id  — delete a message
router.delete('/support/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM support_messages WHERE id = $1', [req.params.id]);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting message' });
  }
});
 


module.exports = router;
