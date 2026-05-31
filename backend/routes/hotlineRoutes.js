const express = require('express');
const router = express.Router();

const { verifyAdmin } = require('../middleware/auth');
const { getHotlines, createHotline, updateHotline, deleteHotline } = require('../controllers/hotlineController');

router.get('/',           getHotlines);        
router.post('/',          verifyAdmin, createHotline);   
router.put('/:id',        verifyAdmin, updateHotline);   
router.delete('/:id',     verifyAdmin, deleteHotline);   

module.exports = router;