const express = require('express');
const router = express.Router();

const { verifyAdmin, verifyStaff } = require('../middleware/auth');
const upload = require('../config/multer');
const adminController = require('../controllers/adminController');
const alertController = require('../controllers/alertController');

// Dashboard
router.get('/stats', verifyAdmin, adminController.getStats);
router.get('/users/growth', verifyAdmin, adminController.getUserGrowth);

router.get('/activity', verifyAdmin, adminController.getRecentActivity);

//Botification
router.get('/alerts', verifyStaff, alertController.getFeed);
router.get('/alerts/unread-count', verifyStaff, alertController.getUnreadCount);
router.patch('/alerts/read-all', verifyStaff, alertController.markAllRead);
router.patch('/alerts/:id/read', verifyStaff, alertController.markRead);
router.delete('/alerts/:id', verifyStaff, alertController.deleteAlert);

// Reports
router.get('/reports',verifyAdmin, adminController.getAllReports);
router.get('/reports/trail', verifyAdmin, adminController.getFullReportTrail);
router.get('/reports/types', verifyAdmin, adminController.getReportTypes);
router.get('/reports/quarterly', verifyAdmin, adminController.getQuarterlyReport);
router.put('/reports/:id/status', verifyAdmin, adminController.updateReportStatus);
router.delete('/reports/:id', verifyAdmin, adminController.deleteReport);

// Users
router.get('/users', verifyAdmin, adminController.getAllUsers);
router.post('/users', verifyAdmin, adminController.createStaffUser);
router.delete('/users/:id', verifyAdmin, adminController.deleteUser);

// News
router.get('/news', verifyAdmin, adminController.getAllNews);
router.post('/news', verifyAdmin, upload.single('image'), adminController.createNews);
router.put('/news/:id', verifyAdmin, upload.single('image'), adminController.updateNews);
router.delete('/news/:id', verifyAdmin, adminController.deleteNews);

// Announcements
router.get('/announcements', verifyAdmin, adminController.getAllAnnouncements);
router.post('/announcements', verifyAdmin, upload.single('image'), adminController.createAnnouncement);
router.put('/announcements/:id', verifyAdmin, upload.single('image'), adminController.updateAnnouncement);
router.delete('/announcements/:id', verifyAdmin, adminController.deleteAnnouncement);

// Notifications
router.get('/notifications', verifyAdmin, adminController.getAllNotifications);
router.post('/notifications', verifyAdmin, adminController.createNotification);
router.delete('/notifications/:id', verifyAdmin, adminController.deleteNotification);

// Support
router.get('/support', verifyAdmin, adminController.getAllSupportMessages);
router.patch('/support/:id/read', verifyAdmin, adminController.markSupportMessageRead);
router.post('/support/:id/reply', verifyAdmin, adminController.replySupportMessage);
router.delete('/support/:id', verifyAdmin, adminController.deleteSupportMessage);

module.exports = router;