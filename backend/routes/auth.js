const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');
const dbConfig = require('../config/database');

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, securityQuestion, securityAnswer } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Crear usuario
    const user = await User.create({ nombre, email, password, securityQuestion, securityAnswer });
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: { id: user.id, nombre: user.nombre, email: user.email }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(error.message === 'El correo ya está registrado' ? 400 : 500).json({
      error: error.message || 'Error al registrar usuario'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    // Generar token JWT
    const token = jwt.sign({ id: user.id }, dbConfig.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ 
      token, 
      nombre: user.nombre,
      userId: user.id
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Verificar token
router.get('/auth', authenticateToken, (req, res) => {
  res.json({ id: req.user.id });
});

// Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Actualizar perfil
router.put('/update-profile', authenticateToken, async (req, res) => {
  try {
    const { nombre, email, currentPassword, newPassword } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' });
    }

    // Si hay cambio de contraseña
    if (currentPassword && newPassword) {
      const user = await User.findByEmail(email);
      
      if (!user || user.id !== req.user.id) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }

      await User.updatePassword(req.user.id, newPassword);
    }

    await User.updateProfile(req.user.id, { nombre, email });
    
    res.json({ success: true, message: 'Perfil actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

// Eliminar cuenta
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    await User.delete(req.user.id);
    res.json({ success: true, message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
});

// Obtener pregunta de seguridad
router.get('/get-security-question/:email', async (req, res) => {
  try {
    const question = await User.getSecurityQuestion(req.params.email);
    
    if (!question) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ security_question: question });
  } catch (error) {
    console.error('Error al obtener pregunta de seguridad:', error);
    res.status(500).json({ error: 'Error al obtener la pregunta de seguridad' });
  }
});

// Verificar respuesta de seguridad
router.post('/verify-security-answer', async (req, res) => {
  try {
    const { email, answer } = req.body;

    const isValid = await User.verifySecurityAnswer(email, answer);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Respuesta incorrecta' });
    }

    res.json({ success: true, message: 'Respuesta verificada' });
  } catch (error) {
    console.error('Error al verificar respuesta:', error);
    res.status(500).json({ error: 'Error al verificar la respuesta' });
  }
});

// Resetear contraseña
router.post('/reset-password', async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;

    const isValid = await User.verifySecurityAnswer(email, answer);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Respuesta de seguridad incorrecta' });
    }

    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await User.updatePassword(user.id, newPassword);
    
    res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
});

module.exports = router;
