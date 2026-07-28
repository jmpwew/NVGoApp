const pool = require('../config/db');
const { uploadToFirebase } = require('../utils/uploadToFirebase');

exports.updateProfile = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { firstname, lastname, email, contact, address } = req.body;

    const imageUrl = req.file
      ? await uploadToFirebase(req.file, 'profile-images')
      : null;

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
      [firstname, lastname, email, contact, address, imageUrl, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });

  } catch (err) {
    console.error('UPDATE ERROR:', err);
    res.status(500).json({ error: err.message });
  }
};