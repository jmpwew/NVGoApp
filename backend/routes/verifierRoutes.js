const express = require('express');
const router = express.Router();

const { verifyVerifier } = require('../middleware/auth');
const verifierController = require('../controllers/verifierController');
const { REPORT_TYPES } = require('../utils/reportTypes');

router.get('/report-types', verifyVerifier, (req, res) => res.json(REPORT_TYPES));
router.get('/reports/pending',  verifyVerifier, verifierController.getPendingReports);
router.get('/reports/verified', verifyVerifier, verifierController.getVerifiedReports);
router.put('/reports/:id/verify', verifyVerifier, verifierController.verifyAndAssign);

module.exports = router;
