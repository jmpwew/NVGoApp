const express = require('express');
const router = express.Router();

const { submitSupportMessage } = require('../controllers/supportController');

router.post('/', submitSupportMessage);

module.exports = router;
