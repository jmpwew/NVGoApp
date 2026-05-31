const pool = require('../config/db');
const sendPushNotification = require('../utils/sendPushNotification');

// dashboard
exports.getStats = async (req, res) => {
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
};

// ── Reports ────────────────────────────────────────────────────

exports.getAllReports = async (req, res) => {
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
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE reports SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    const report = result.rows[0];

    // notify the user whose report was updated
    const tokenResult = await pool.query(
      'SELECT push_token FROM users WHERE id = $1',
      [report.user_id]
    );
    const pushToken = tokenResult.rows[0]?.push_token;
    if (pushToken) {
      await sendPushNotification(
        [pushToken],
        'Report Status Updated',
        `Your report is now marked as: ${status}`
      );
    }

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating report' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting report' });
  }
};

// users

exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, firstname, lastname, email, contact, address, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// News

exports.getAllNews = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching news' });
  }
};

exports.createNews = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const image = req.file ? req.file.filename : null;
    const result = await pool.query(
      `INSERT INTO news (title, content, category, image, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, content, category || 'announcement', image, req.user.id]
    );

    // notify all users about new announcement
    const tokens = await pool.query(
      'SELECT push_token FROM users WHERE push_token IS NOT NULL'
    );
    const pushTokens = tokens.rows.map(r => r.push_token);
    if (pushTokens.length > 0) {
      await sendPushNotification(
        pushTokens,
        'New Announcement',
        title
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating news' });
  }
};

exports.updateNews = async (req, res) => {
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
};

exports.deleteNews = async (req, res) => {
  try {
    await pool.query('DELETE FROM news WHERE id = $1', [req.params.id]);
    res.json({ message: 'News deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting news' });
  }
};

// notification

exports.getAllNotifications = async (req, res) => {
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
};

exports.createNotification = async (req, res) => {
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
};

exports.deleteNotification = async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

// Support

exports.getAllSupportMessages = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM support_messages ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching support messages' });
  }
};

exports.markSupportMessageRead = async (req, res) => {
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
};

exports.deleteSupportMessage = async (req, res) => {
  try {
    await pool.query('DELETE FROM support_messages WHERE id = $1', [req.params.id]);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting message' });
  }
};