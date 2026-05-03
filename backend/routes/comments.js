const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const authenticateToken = require('../middleware/auth');

// Obtener comentarios de una receta
router.get('/comentarios/:id', commentController.findByRecipeId);

// Crear comentario (requiere autenticación)
router.post('/comentarios', authenticateToken, commentController.create);

// Actualizar comentario (requiere autenticación)
router.put('/comentarios/:id', authenticateToken, commentController.update);

// Eliminar comentario (requiere autenticación)
router.delete('/comentarios/:id', authenticateToken, commentController.delete);

// Obtener respuestas a un comentario
router.get('/comentarios/:id/respuestas', commentController.getReplies);

// Crear respuesta a comentario (requiere autenticación)
router.post('/comentarios/:id/respuestas', authenticateToken, commentController.createReply);

// Eliminar respuesta (requiere autenticación)
router.delete('/respuestas_comentarios_recetas/:id', authenticateToken, commentController.deleteReply);

module.exports = router;
