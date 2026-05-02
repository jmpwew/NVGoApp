const pool = require('../config/db');

exports.updateProfile = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const { firstname, lastname, email, contact, address, user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID missing' });
    }

    const filename = req.file ? req.file.filename : null;

    const result = await pool.query(
      `UPDATE users
       SET firstname = $1,
           lastname  = $2,
           email     = $3,
           contact   = $4,
           address   = $5,
           image     = COALESCE($6, image)
       WHERE id = $7
       RETURNING id, firstname, lastname, email, contact, address, role, image`,
      [firstname, lastname, email, contact, address, filename, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: result.rows[0]
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};