const pool = require('../config/db');

// GET /api/announcements
// Active announcements only, most urgent first, newest first within the
// same urgency level. This is what the Home screen carousel reads from.
exports.getActiveAnnouncements = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, message, image, urgency, created_at
       FROM announcements
       WHERE is_active = TRUE
       ORDER BY
         CASE urgency
           WHEN 'emergency' THEN 1
           WHEN 'warning'   THEN 2
           ELSE 3
         END,
         created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching announcements' });
  }
};
