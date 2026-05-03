const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/auth');

// Registro de usuario
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Obtener perfil del usuario (ruta protegida)
router.get('/profile', authenticateToken, authController.getProfile);

// Actualizar perfil del usuario (ruta protegida)
router.put('/profile', authenticateToken, authController.updateProfile);

// Cambiar contraseña (ruta protegida)
router.put('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
