const bcrypt = require('bcrypt');
const pool = require('../config/db');
const nodemailer = require('nodemailer');

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/auth/forgot-password
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const result = await pool.query('SELECT id, firstname FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No account found with that email.' });
    }

    const user = result.rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore[email] = { otp, expiresAt };

    await transporter.sendMail({
      from: `"NVGo App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your NVGo Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">NVGo Password Reset</h2>
          <p>Hi ${user.firstname},</p>
          <p>Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="background: #f1f8e9; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2e7d32;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
          <p style="color: #888; font-size: 13px;">— Municipality of Nueva Valencia, Guimaras</p>
        </div>
      `,
    });

    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('sendOtp error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const entry = otpStore[email];
    if (!entry) return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    if (Date.now() > entry.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (entry.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // Mark OTP as verified (keep for reset step)
    otpStore[email].verified = true;

    res.json({ message: 'OTP verified.' });
  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ message: 'Verification failed.' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: 'Email and new password are required.' });

    const entry = otpStore[email];
    if (!entry || !entry.verified) {
      return res.status(403).json({ message: 'OTP not verified. Please verify your OTP first.' });
    }
    if (Date.now() > entry.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: 'Session expired. Please start over.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashed, email]);

    delete otpStore[email];

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Password reset failed.' });
  }
};