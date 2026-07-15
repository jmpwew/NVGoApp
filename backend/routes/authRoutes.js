// imports
const express = require('express');
const { register, login, verifyRegisterOtp, resendRegisterOtp } = require('../controllers/authController');

const router = express.Router();

// routes
router.post('/register', register);
router.post('/verify-register-otp', verifyRegisterOtp);
router.post('/resend-register-otp', resendRegisterOtp);
router.post('/login', login);

// export
module.exports = router;