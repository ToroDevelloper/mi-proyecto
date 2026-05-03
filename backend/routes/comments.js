const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const authenticateToken = require('../middleware/auth');

// Obtener comentarios de una receta
router.get('/api/comentarios/:id', async (req, res) => {
  try {
    const comments = await Comment.findByRecipeId(req.params.id);
    res.json(comments);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// Crear comentario (requiere autenticación)
router.post('/api/comentarios', authenticateToken, async (req, res) => {
  try {
    const { receta_id, comentario, calificacion } = req.body;

    if (!receta_id || !comentario || !calificacion) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const newComment = await Comment.create({
      receta_id,
      usuario_id: req.user.id,
      comentario,
      calificacion
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ error: 'Error al crear comentario' });
  }
});

// Actualizar comentario (requiere autenticación)
router.put('/api/comentarios/:id', authenticateToken, async (req, res) => {
  try {
    const { comentario, calificacion } = req.body;

    const updated = await Comment.update(req.params.id, {
      comentario,
      calificacion
    }, req.user.id);

    if (!updated) {
      return res.status(403).json({ error: 'No autorizado para editar este comentario' });
    }

    res.json({ message: 'Comentario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    res.status(500).json({ error: 'Error al actualizar comentario' });
  }
});

// Eliminar comentario (requiere autenticación)
router.delete('/api/comentarios/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Comment.delete(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(403).json({ error: 'No autorizado para eliminar este comentario' });
    }

    res.json({ message: 'Comentario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
});

// Obtener respuestas a un comentario
router.get('/api/comentarios/:id/respuestas', async (req, res) => {
  try {
    const replies = await Comment.getReplies(req.params.id);
    res.json(replies);
  } catch (error) {
    console.error('Error al obtener respuestas:', error);
    res.status(500).json({ error: 'Error al obtener respuestas' });
  }
});

// Crear respuesta a comentario (requiere autenticación)
router.post('/api/comentarios/:id/respuestas', authenticateToken, async (req, res) => {
  try {
    const { respuesta } = req.body;

    if (!respuesta) {
      return res.status(400).json({ error: 'Respuesta requerida' });
    }

    const newReply = await Comment.createReply({
      comentario_id: req.params.id,
      usuario_id: req.user.id,
      respuesta
    });

    res.status(201).json(newReply);
  } catch (error) {
    console.error('Error al crear respuesta:', error);
    res.status(500).json({ error: 'Error al crear respuesta' });
  }
});

// Eliminar respuesta (requiere autenticación)
router.delete('/api/respuestas_comentarios_recetas/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Comment.deleteReply(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(403).json({ error: 'No autorizado para eliminar esta respuesta' });
    }

    res.json({ message: 'Respuesta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar respuesta:', error);
    res.status(500).json({ error: 'Error al eliminar respuesta' });
  }
});

module.exports = router;
