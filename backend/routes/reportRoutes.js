const express = require('express');
const router = express.Router();

const { optionalAuth, verifyUser } = require('../middleware/auth');
const upload = require('../config/multer');
const { createReport, getReportsByUser } = require('../controllers/reportController');

router.post('/', optionalAuth, upload.array('images', 5), createReport);
router.get('/user/:id', verifyUser, getReportsByUser);

module.exports = router;