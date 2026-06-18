const express = require('express');
const router = express.Router();

// On importe notre cerveau
const userController = require('../controllers/userProfile.controller');

// Quand quelqu'un envoie des données en POST sur cette route, le cerveau s'active
router.post('/', userController.createProfile);

// Quand quelqu'un fait un GET en précisant l'ID (ex: /42), on lance la lecture
router.get('/:authId', userController.getProfile);

// Quand quelqu'un fait un PUT en précisant l'ID, on lance la modification
router.put('/:authId', userController.updateProfile);

// Quand quelqu'un fait un DELETE en précisant l'ID, on lance la suppression
router.delete('/:authId', userController.deleteProfile);

// --- ROUTES SOCIALES ---
// Un POST sur l'URL d'un utilisateur ciblé pour s'abonner / se désabonner
router.post('/:targetId/follow', userController.followUser);
router.post('/:targetId/unfollow', userController.unfollowUser);

// Quand un admin/modo veut changer le statut d'un utilisateur
router.put('/:authId/status', userController.updateUserStatus);
module.exports = router;