const express = require('express');
const router = express.Router();

const upload = require('../config/multer');
const { updateProfile } = require('../controllers/profileController');

router.put('/', upload.single('image'), updateProfile);

module.exports = router;