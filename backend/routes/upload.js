const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const authenticateToken = require('../middleware/auth');

// Ruta para subir foto de perfil (requiere autenticación)
router.post('/update-profile-photo', authenticateToken, uploadController.uploadProfilePhoto);

module.exports = router;
