// imports
const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// routes
router.post('/register', register);
router.post('/login', login);

// export
module.exports = router;