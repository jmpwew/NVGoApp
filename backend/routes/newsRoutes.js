const express = require('express');
const router = express.Router();

const upload = require('../config/multer');
const { createNews, getNewsByCategory, getAllNews } = require('../controllers/newsController');

router.post('/', upload.single('image'), createNews);
router.get('/category/:category', getNewsByCategory);
router.get('/', getAllNews);

module.exports = router;
