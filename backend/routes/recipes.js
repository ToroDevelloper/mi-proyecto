const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const authenticateToken = require('../middleware/auth');

// Obtener todas las recetas
router.get('/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.findAll();
    res.json(recipes);
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener recetas destacadas
router.get('/featured-recipes', async (req, res) => {
  try {
    const recipes = await Recipe.getFeatured(6);
    res.json(recipes);
  } catch (error) {
    console.error('Error al obtener recetas destacadas:', error);
    res.status(500).json({ error: 'Error al obtener recetas destacadas' });
  }
});

// Obtener receta por ID
router.get('/get-recipe/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error('Error al obtener receta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Buscar recetas
router.get('/api/search', async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ error: 'Término de búsqueda requerido' });
    }
    
    const recipes = await Recipe.search(term);
    res.json(recipes);
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ error: 'Error al realizar la búsqueda' });
  }
});

// Crear nueva receta (requiere autenticación)
router.post('/add-recipe', authenticateToken, async (req, res) => {
  try {
    const { 
      nombre_receta, 
      categoria, 
      tiempo,
      ingredientes, 
      pasos, 
      imagen_url, 
      informacion_nutricional 
    } = req.body;

    if (!nombre_receta || !categoria || !ingredientes || !pasos) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const recipe = await Recipe.create({
      nombre_receta,
      categoria,
      tiempo,
      ingredientes,
      pasos,
      imagen_url,
      informacion_nutricional
    }, req.user.id);

    res.status(201).json({ 
      message: 'Receta añadida exitosamente',
      recipe 
    });
  } catch (error) {
    console.error('Error al añadir receta:', error);
    res.status(500).json({ error: 'Error al añadir la receta' });
  }
});

// Actualizar receta (requiere autenticación)
router.put('/recipe/:id', authenticateToken, async (req, res) => {
  try {
    const { 
      nombre_receta, 
      categoria, 
      tiempo,
      ingredientes, 
      pasos, 
      imagen_url, 
      informacion_nutricional 
    } = req.body;

    await Recipe.update(req.params.id, {
      nombre_receta,
      categoria,
      tiempo,
      ingredientes,
      pasos,
      imagen_url,
      informacion_nutricional
    }, req.user.id);

    res.json({ message: 'Receta actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar receta:', error);
    res.status(error.message.includes('no encontrada') ? 404 : 500).json({ 
      error: error.message || 'Error al actualizar la receta' 
    });
  }
});

// Eliminar receta (requiere autenticación)
router.delete('/recipe/:id', authenticateToken, async (req, res) => {
  try {
    await Recipe.delete(req.params.id, req.user.id);
    res.json({ message: 'Receta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar receta:', error);
    res.status(error.message.includes('no encontrada') ? 404 : 500).json({ 
      error: error.message || 'Error al eliminar la receta' 
    });
  }
});

// Obtener recetas del usuario autenticado
router.get('/user-recipes', authenticateToken, async (req, res) => {
  try {
    const recipes = await Recipe.findByUserId(req.user.id);
    res.json(recipes);
  } catch (error) {
    console.error('Error al obtener recetas del usuario:', error);
    res.status(500).json({ error: 'Error al obtener las recetas' });
  }
});

module.exports = router;
