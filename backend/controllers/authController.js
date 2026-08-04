const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const sendPushNotification = require('../utils/sendPushNotification');
const sendEmail = require('../utils/sendEmail');

// In-memory pending-registration store: { email: { otp, expiresAt, data } }
const pendingRegistrations = {};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendRegisterOtpEmail = async (email, firstname, otp) => {
  await sendEmail({
    to: email,
    toName: firstname,
    subject: 'Verify your NVGo account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Welcome to NVGo</h2>
        <p>Hi ${firstname},</p>
        <p>Use the code below to verify your email and finish creating your account. It expires in <strong>10 minutes</strong>.</p>
        <div style="background: #f1f8e9; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2e7d32;">${otp}</span>
        </div>
        <p style="color: #888; font-size: 13px;">If you did not create an account, you can safely ignore this email.</p>
        <p style="color: #888; font-size: 13px;">— Municipality of Nueva Valencia, Guimaras</p>
      </div>
    `,
  });
};

// register user (step 1) - validates, stashes the signup, emails an OTP
exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password, contact, address } = req.body;

    if (!firstname || !lastname || !email || !password || !contact || !address) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include a letter and a number.' });
    }

    const check = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    pendingRegistrations[email] = {
      otp,
      expiresAt,
      data: { firstname, lastname, email, password: hashedPassword, contact, address },
    };

    await sendRegisterOtpEmail(email, firstname, otp);

    res.json({ message: 'OTP sent to your email.', email });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Register error' });
  }
};

// verify registration OTP (step 2) - creates the account
exports.verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const entry = pendingRegistrations[email];
    if (!entry) {
      return res.status(400).json({ message: 'No pending registration found. Please sign up again.' });
    }
    if (Date.now() > entry.expiresAt) {
      delete pendingRegistrations[email];
      return res.status(400).json({ message: 'OTP has expired. Please sign up again.' });
    }
    if (entry.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // double-check no one else registered this email while OTP was pending
    const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      delete pendingRegistrations[email];
      return res.status(400).json({ message: 'Email already exists' });
    }

    const { firstname, lastname, password, contact, address } = entry.data;

    const result = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, contact, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, firstname, lastname, email, contact, address, role, image`,
      [firstname, lastname, email, password, contact, address]
    );

    delete pendingRegistrations[email];

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'OTP verification failed' });
  }
};

// resend registration OTP
exports.resendRegisterOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const entry = pendingRegistrations[email];
    if (!entry) {
      return res.status(400).json({ message: 'No pending registration found. Please sign up again.' });
    }

    const otp = generateOtp();
    entry.otp = otp;
    entry.expiresAt = Date.now() + 10 * 60 * 1000;

    await sendRegisterOtpEmail(email, entry.data.firstname, otp);

    res.json({ message: 'OTP resent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to resend OTP.' });
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
    );

    // send welcome notification on first login
    if (user.push_token && !user.last_login) {
      await sendPushNotification(
        [user.push_token],
        '👋 Welcome to NVGo!',
        `Hello ${user.firstname}! Your account is ready. Stay updated with your barangay.`
      );
    }

    // update last_login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
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