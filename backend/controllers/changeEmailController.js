const pool = require('../config/db');
const sendEmail = require('../utils/sendEmail');


const otpStore = {};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/profile/email/send-otp
// Sends a verification code to the user's old email address,

exports.sendEmailChangeOtp = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      'SELECT id, firstname, email FROM users WHERE id = $1',
      [user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = result.rows[0];
    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore[user_id] = { otp, expiresAt, verified: false, oldEmail: user.email };

    await sendEmail({
      to: user.email,
      toName: user.firstname,
      subject: 'Your NVGo Email Change Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #2e7d32;">Confirm Email Change</h2>
          <p>Hi ${user.firstname},</p>
          <p>We received a request to change the email address on your NVGo account. Use the code below to confirm it's you. It expires in <strong>10 minutes</strong>.</p>
          <div style="background: #f1f8e9; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2e7d32;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 13px;">If you did not request this, you can safely ignore this email — your address will not be changed.</p>
          <p style="color: #888; font-size: 13px;">— Municipality of Nueva Valencia, Guimaras</p>
        </div>
      `,
    });

    res.json({ message: 'A verification code was sent to your current email.', email: user.email });
  } catch (err) {
    console.error('sendEmailChangeOtp error:', err);
    res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
  }
};

// POST /api/profile/email/verify-otp
// Verifies the code sent to the OLD email.
exports.verifyEmailChangeOtp = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { otp } = req.body;

    if (!otp) return res.status(400).json({ message: 'OTP is required.' });

    const entry = otpStore[user_id];
    if (!entry) return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    if (Date.now() > entry.expiresAt) {
      delete otpStore[user_id];
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (entry.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    otpStore[user_id].verified = true;

    res.json({ message: 'OTP verified.' });
  } catch (err) {
    console.error('verifyEmailChangeOtp error:', err);
    res.status(500).json({ message: 'Verification failed.' });
  }
};

// PUT /api/profile/email
// Applies the new email address, only after the OTP sent to the old

exports.changeEmail = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { newEmail } = req.body;

    if (!newEmail) return res.status(400).json({ message: 'New email is required.' });

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const entry = otpStore[user_id];
    if (!entry || !entry.verified) {
      return res.status(403).json({ message: 'Please verify the code sent to your current email first.' });
    }
    if (Date.now() > entry.expiresAt) {
      delete otpStore[user_id];
      return res.status(400).json({ message: 'Session expired. Please start over.' });
    }

    if (newEmail.toLowerCase() === entry.oldEmail.toLowerCase()) {
      return res.status(400).json({ message: 'New email must be different from your current email.' });
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [newEmail, user_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'That email is already in use by another account.' });
    }

    const result = await pool.query(
      `UPDATE users SET email = $1 WHERE id = $2
       RETURNING id, firstname, lastname, email, contact, address, role, image`,
      [newEmail, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    delete otpStore[user_id];

    res.json({ message: 'Email updated successfully.', user: result.rows[0] });
  } catch (err) {
    console.error('changeEmail error:', err);
    res.status(500).json({ message: err.message || 'Failed to update email.' });
  }
};
