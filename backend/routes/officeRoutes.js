const express = require('express');
const router = express.Router();

const { verifyOffice } = require('../middleware/auth');
const officeController = require('../controllers/officeController');

router.get('/assignments', verifyOffice, officeController.getMyAssignments);
router.put('/assignments/:assignmentId', verifyOffice, officeController.updateAssignment);

module.exports = router;
