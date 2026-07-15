const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.deleteAccount = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    // Get user from db
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [user_id]);

    res.json({ message: 'Account deleted successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};