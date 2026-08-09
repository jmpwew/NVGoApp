const express = require('express');
const router = express.Router();

const { getActiveAnnouncements } = require('../controllers/announcementController');

router.get('/', getActiveAnnouncements);

module.exports = router;
