const pool = require('../config/db');
const expireAnnouncements = require('../utils/expireAnnouncements');


exports.getActiveAnnouncements = async (req, res) => {
  try {
    await expireAnnouncements();
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