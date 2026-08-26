const express = require('express');
const router = express.Router();

const { optionalAuth } = require('../middleware/auth');
const { submitSupportMessage } = require('../controllers/supportController');

router.post('/', optionalAuth, submitSupportMessage);

module.exports = router;