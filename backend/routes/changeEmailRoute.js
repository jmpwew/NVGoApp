const express = require('express');
const router = express.Router();

const {
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
  changeEmail,
} = require('../controllers/changeEmailController');

const { verifyUser } = require('../middleware/auth');

router.post('/send-otp', verifyUser, sendEmailChangeOtp);
router.post('/verify-otp', verifyUser, verifyEmailChangeOtp);
router.put('/', verifyUser, changeEmail);

module.exports = router;
