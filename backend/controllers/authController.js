
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');


// register user
exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password, contact, address } = req.body;

    if (!firstname || !lastname || !email || !password || !contact || !address) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const check = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, contact, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, firstname, lastname, email, contact, address, role, image`,
      [firstname, lastname, email, hashedPassword, contact, address]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Register error' });
  }
};


// login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        contact: user.contact,
        address: user.address,
        role: user.role,
        image: user.image
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login error' });
  }
};