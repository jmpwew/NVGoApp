 const bcrypt = require('bcrypt');
const pool = require('../config/db');

const changePassword = async (req, res) => {
  try {
    const { user_id, currentPassword, newPassword } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [user_id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const match = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, user_id]
    );

    return res.json({
      message: 'Password changed successfully'
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  changePassword
};