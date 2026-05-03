const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const authenticateToken = require('../middleware/auth');
const User = require('../models/User');

// Configurar multer para almacenar archivos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/profile-photos/');
  },
  filename: function(req, file, cb) {
    cb(null, `user-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Solo se permiten imágenes'));
    }
    cb(null, true);
  }
});

// Ruta para subir foto de perfil
router.post('/update-profile-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
    
    await User.updateProfilePhoto(req.user.id, photoUrl);
    
    res.json({ 
      success: true, 
      message: 'Foto de perfil actualizada exitosamente',
      photo_url: photoUrl
    });
  } catch (error) {
    console.error('Error al actualizar foto de perfil:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar la foto de perfil' });
  }
});

module.exports = router;
