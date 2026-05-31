const express = require('express');
const router = express.Router();

const { verifyUser } = require('../middleware/auth');
const upload = require('../config/multer');
const { updateProfile } = require('../controllers/profileController');

router.put('/', verifyUser, upload.single('image'), updateProfile);

module.exports = router;