const express = require('express');
const router = express.Router();

const userController = require('../controllers/userProfile.controller');
const { requireRole } = require('../middlewares/role.middleware');

router.post('/', userController.createProfile);
router.get('/', requireRole('moderator', 'admin'), userController.getAllProfiles);

router.get('/:authId', userController.getProfile);
router.get('/username/:username', userController.getProfileByUsername);
router.put('/:authId', userController.updateProfile);
router.delete('/:authId', userController.deleteProfile);

router.post('/:targetId/follow', userController.followUser);
router.post('/:targetId/unfollow', userController.unfollowUser);

router.put('/:authId/status', requireRole('moderator', 'admin'), userController.updateUserStatus);

module.exports = router;
