const express = require('express');
const router = express.Router();

const upload = require('../config/multer');
const { verifyAdmin } = require('../middleware/auth');
const {
  getPublicBoard,
  getAdminBoard,
  updateBoard,
  createInfrastructure,
  updateInfrastructure,
  deleteInfrastructure,
  createAccomplishment,
  updateAccomplishment,
  deleteAccomplishment,
} = require('../controllers/transparencyController');

// Public — mobile app reads the published board
router.get('/', getPublicBoard);

// Admin — full board (published or not) + edit
router.get('/admin', verifyAdmin, getAdminBoard);
router.put('/', verifyAdmin, updateBoard);

// Admin — infrastructure items
router.post('/infrastructure', verifyAdmin, upload.single('image'), createInfrastructure);
router.put('/infrastructure/:id', verifyAdmin, upload.single('image'), updateInfrastructure);
router.delete('/infrastructure/:id', verifyAdmin, deleteInfrastructure);

// Admin — accomplishment items
router.post('/accomplishments', verifyAdmin, upload.single('image'), createAccomplishment);
router.put('/accomplishments/:id', verifyAdmin, upload.single('image'), updateAccomplishment);
router.delete('/accomplishments/:id', verifyAdmin, deleteAccomplishment);

module.exports = router;
