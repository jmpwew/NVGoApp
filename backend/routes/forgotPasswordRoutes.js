const express = require('express');
const { sendOtp, verifyOtp, resetPassword } = require('../controllers/forgotPasswordController');

const router = express.Router();

router.post('/forgot-password', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;