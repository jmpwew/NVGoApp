const bcrypt = require('bcrypt');
const pool = require('../config/db');
const sendPushNotification = require('../utils/sendPushNotification');
const { uploadToSupabase } = require('../utils/uploadToSupabase');

// staff roles that admins are allowed to create from the admin panel
const STAFF_ROLES = ['admin', 'verifier', 'police', 'bfp', 'medical'];


const PUSH_BODY_MAX_LEN = 150;
function truncateForPush(text) {
  if (!text) return '';
  const clean = text.trim();
  if (clean.length <= PUSH_BODY_MAX_LEN) return clean;
  return clean.slice(0, PUSH_BODY_MAX_LEN).trimEnd() + '...';
}

// dashboard
exports.getStats = async (req, res) => {
  try {
    const totalReports    = await pool.query('SELECT COUNT(*) FROM reports');
    const pendingReports  = await pool.query("SELECT COUNT(*) FROM reports WHERE status = 'pending'");
    const resolvedReports = await pool.query("SELECT COUNT(*) FROM reports WHERE status = 'resolved'");
    const totalUsers      = await pool.query('SELECT COUNT(*) FROM users');
    const totalNews       = await pool.query('SELECT COUNT(*) FROM news');
    const unreadSupport   = await pool.query('SELECT COUNT(*) FROM support_messages WHERE is_read = FALSE');

    res.json({
      totalReports:    parseInt(totalReports.rows[0].count),
      pendingReports:  parseInt(pendingReports.rows[0].count),
      resolvedReports: parseInt(resolvedReports.rows[0].count),
      totalUsers:      parseInt(totalUsers.rows[0].count),
      totalNews:       parseInt(totalNews.rows[0].count),
      unreadSupport:   parseInt(unreadSupport.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};



exports.getUserGrowth = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT EXTRACT(MONTH FROM created_at)::int AS month, COUNT(*)::int AS count
       FROM users
       WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       GROUP BY month
       ORDER BY month`
    );

    // fill in every month (1-12) so the chart always has 12 points
    const counts = Array(12).fill(0);
    result.rows.forEach(row => {
      counts[row.month - 1] = row.count;
    });

    res.json({
      year: new Date().getFullYear(),
      months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      counts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user growth' });
  }
};



// recent activity feed for the notification bell (unresolved reports + unread support messages)
exports.getRecentActivity = async (req, res) => {
  try {
    const reports = await pool.query(
      `SELECT id, name, description, created_at
       FROM reports
       WHERE status = 'pending'
       ORDER BY created_at DESC
       LIMIT 8`
    );

    const support = await pool.query(
      `SELECT id, name, message, created_at
       FROM support_messages
       WHERE is_read = FALSE
       ORDER BY created_at DESC
       LIMIT 8`
    );

    const items = [
      ...reports.rows.map(r => ({
        type: 'report',
        id: r.id,
        title: 'New report submitted',
        detail: r.name ? `From ${r.name}` : (r.description ? r.description.slice(0, 60) : ''),
        created_at: r.created_at,
      })),
      ...support.rows.map(s => ({
        type: 'support',
        id: s.id,
        title: 'New support message',
        detail: s.name ? `From ${s.name}` : (s.message ? s.message.slice(0, 60) : ''),
        created_at: s.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching recent activity' });
  }
};

//  Reports 

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


exports.getFullReportTrail = async (req, res) => {
  try {
    const reportsResult = await pool.query(
      `SELECT r.*,
              u.firstname AS reporter_firstname,
              u.lastname  AS reporter_lastname,
              v.firstname AS verifier_firstname,
              v.lastname  AS verifier_lastname
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN users v ON r.verified_by = v.id
       ORDER BY r.created_at DESC`
    );

    const assignmentsResult = await pool.query(
      `SELECT * FROM report_assignments ORDER BY assigned_at ASC`
    );

    const assignmentsByReport = {};
    for (const a of assignmentsResult.rows) {
      if (!assignmentsByReport[a.report_id]) assignmentsByReport[a.report_id] = [];
      assignmentsByReport[a.report_id].push(a);
    }

    const reports = reportsResult.rows.map(r => ({
      ...r,
      verifier: r.verified_by
        ? { id: r.verified_by, firstname: r.verifier_firstname, lastname: r.verifier_lastname, verified_at: r.verified_at }
        : null,
      assignments: assignmentsByReport[r.id] || [],
    }));

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching report trail' });
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
    if (report.user_id) {
      const isResolved = status === 'resolved';
      const title = isResolved ? 'Report Resolved' : 'Report Status Updated';
      const body = isResolved
        ? 'Your report has been resolved. Thank you for helping keep the community safe.'
        : `Your report is now marked as: ${status}`;

      // save to the user's in-app notification history
      await pool.query(
        `INSERT INTO notifications (user_id, title, body, type)
         VALUES ($1, $2, $3, $4)`,
        [report.user_id, title, body, isResolved ? 'update' : 'report']
      ).catch(err => console.error('insert notification (report status) failed:', err));

      const tokenResult = await pool.query(
        'SELECT push_token FROM users WHERE id = $1',
        [report.user_id]
      );
      const pushToken = tokenResult.rows[0]?.push_token;
      if (pushToken) {
        await sendPushNotification([pushToken], title, body);
      }
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

// create a staff account (admin, verifier, or office: police/bfp/medical)
exports.createStaffUser = async (req, res) => {
  try {
    const { firstname, lastname, email, password, contact, address, role } = req.body;

    if (!firstname || !lastname || !email || !password || !role) {
      return res.status(400).json({ message: 'Firstname, lastname, email, password, and role are required' });
    }

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include a letter and a number.' });
    }

    const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, contact, address, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, firstname, lastname, email, contact, address, role, created_at`,
      [firstname, lastname, email, hashedPassword, contact || null, address || null, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating user' });
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
    const image = req.file
      ? await uploadToSupabase(req.file, 'news-images')
      : null;
    const result = await pool.query(
      `INSERT INTO news (title, content, category, image, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, content, category || 'announcement', image, req.user.id]
    );
    const news = result.rows[0];

 
    await pool.query(
      `INSERT INTO notifications (user_id, title, body, type, image, related_type, related_id)
       VALUES (NULL, $1, $2, 'update', $3, 'news', $4)`,
      [title, content, image, news.id]
    );

    // notify all users about new news
    const tokens = await pool.query(
      'SELECT push_token FROM users WHERE push_token IS NOT NULL'
    );
    const pushTokens = tokens.rows.map(r => r.push_token);
    if (pushTokens.length > 0) {
      await sendPushNotification(pushTokens, title, truncateForPush(content), image);
    }

    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating news' });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const image = req.file
      ? await uploadToSupabase(req.file, 'news-images')
      : null;

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

// Announcements

exports.getAllAnnouncements = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching announcements' });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, urgency, is_active } = req.body;
    const image = req.file
      ? await uploadToSupabase(req.file, 'announcement-images')
      : null;
    const active = is_active === undefined ? true : is_active === 'true' || is_active === true;

    const result = await pool.query(
      `INSERT INTO announcements (title, message, image, urgency, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, message, image, urgency || 'info', active, req.user.id]
    );
    const announcement = result.rows[0];

    // notify all users when a new, active announcement goes out
    if (active) {
  
      const notifType = (urgency === 'emergency' || urgency === 'warning') ? 'alert' : 'info';
      await pool.query(
        `INSERT INTO notifications (user_id, title, body, type, image, related_type, related_id)
         VALUES (NULL, $1, $2, $3, $4, 'announcement', $5)`,
        [title, message, notifType, image, announcement.id]
      );

      const tokens = await pool.query(
        'SELECT push_token FROM users WHERE push_token IS NOT NULL'
      );
      const pushTokens = tokens.rows.map(r => r.push_token);
      if (pushTokens.length > 0) {
        await sendPushNotification(pushTokens, title, truncateForPush(message), image);
      }
    }

    res.json(announcement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating announcement' });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { title, message, urgency, is_active } = req.body;
    const image = req.file
      ? await uploadToSupabase(req.file, 'announcement-images')
      : null;
    const active = is_active === undefined ? true : is_active === 'true' || is_active === true;

    const result = image
      ? await pool.query(
          `UPDATE announcements SET title=$1, message=$2, urgency=$3, is_active=$4, image=$5, updated_at=NOW()
           WHERE id=$6 RETURNING *`,
          [title, message, urgency, active, image, req.params.id]
        )
      : await pool.query(
          `UPDATE announcements SET title=$1, message=$2, urgency=$3, is_active=$4, updated_at=NOW()
           WHERE id=$5 RETURNING *`,
          [title, message, urgency, active, req.params.id]
        );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating announcement' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting announcement' });
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