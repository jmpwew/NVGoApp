const pool = require('../config/db');
const { uploadToSupabase } = require('../utils/uploadToSupabase');

exports.updateProfile = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { firstname, lastname, email, contact, address, remove_image } = req.body;

    const shouldRemove = remove_image === 'true' || remove_image === true;

    const imageUrl = req.file
      ? await uploadToSupabase(req.file, 'profile-images')
      : null;

    const result = await pool.query(
      `UPDATE users
       SET firstname = $1,
           lastname  = $2,
           email     = $3,
           contact   = $4,
           address   = $5,
           image     = CASE
                          WHEN $6::text IS NOT NULL THEN $6
                          WHEN $7::boolean THEN NULL
                          ELSE image
                        END
       WHERE id = $8
       RETURNING id, firstname, lastname, email, contact, address, role, image`,
      [firstname, lastname, email, contact, address, imageUrl, shouldRemove, user_id]
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