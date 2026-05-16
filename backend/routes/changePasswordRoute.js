const express = require('express');
const router = express.Router();

const {
  changePassword
} = require('../controllers/changePasswordController');

router.put('/change-password', changePassword);

module.exports = router;