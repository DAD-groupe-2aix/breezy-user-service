const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notification.controller');

router.post('/', notifController.createNotif);
router.get('/:userId', notifController.getUserNotifs);
router.put('/:userId/read-all', notifController.markAllRead);

module.exports = router;
