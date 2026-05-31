const express = require('express');
const router = express.Router();

;
const { verifyUser } = require('../middleware/auth');
const { savePushToken } = require('../controllers/notificationController');
const { getNotifications, markNotificationRead,  markAllNotificationsRead, deleteNotification,} = require('../controllers/notificationController');

router.get('/', verifyUser, getNotifications);
router.patch('/read-all', verifyUser, markAllNotificationsRead);
router.patch('/:id/read', verifyUser, markNotificationRead);
router.delete('/:id', verifyUser, deleteNotification);
router.post('/push-token', verifyUser, savePushToken);


module.exports = router;
