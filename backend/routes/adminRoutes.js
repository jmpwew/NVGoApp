const express = require('express');
const router = express.Router();

const { verifyAdmin } = require('../middleware/auth');
const upload = require('../config/multer');
const adminController = require('../controllers/adminController');

// Dashboard
router.get('/stats', verifyAdmin, adminController.getStats);

// Reports
router.get('/reports',verifyAdmin, adminController.getAllReports);
router.put('/reports/:id/status', verifyAdmin, adminController.updateReportStatus);
router.delete('/reports/:id', verifyAdmin, adminController.deleteReport);

// Users
router.get('/users', verifyAdmin, adminController.getAllUsers);
router.delete('/users/:id', verifyAdmin, adminController.deleteUser);

// News
router.get('/news', verifyAdmin, adminController.getAllNews);
router.post('/news', verifyAdmin, upload.single('image'), adminController.createNews);
router.put('/news/:id', verifyAdmin, upload.single('image'), adminController.updateNews);
router.delete('/news/:id', verifyAdmin, adminController.deleteNews);

// Notifications
router.get('/notifications', verifyAdmin, adminController.getAllNotifications);
router.post('/notifications', verifyAdmin, adminController.createNotification);
router.delete('/notifications/:id', verifyAdmin, adminController.deleteNotification);

// Support
router.get('/support', verifyAdmin, adminController.getAllSupportMessages);
router.patch('/support/:id/read', verifyAdmin, adminController.markSupportMessageRead);
router.delete('/support/:id', verifyAdmin, adminController.deleteSupportMessage);

module.exports = router;
