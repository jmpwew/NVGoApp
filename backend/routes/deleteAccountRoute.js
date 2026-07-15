const express = require('express');
const router = express.Router();
const { deleteAccount } = require('../controllers/deleteAccountController');
const { verifyUser } = require('../middleware/auth');

router.delete('/delete-account', verifyUser, deleteAccount);

module.exports = router;