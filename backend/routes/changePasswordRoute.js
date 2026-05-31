const express = require('express');
const router = express.Router();

const {
  changePassword
} = require('../controllers/changePasswordController');


const { verifyUser } = require('../middleware/auth');
router.put('/change-password', verifyUser, changePassword);



module.exports = router;