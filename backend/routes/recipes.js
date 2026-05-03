const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipe.controller');
const authenticateToken = require('../middleware/auth');

// Obtener todas las recetas
router.get('/recipes', recipeController.findAll);

// Obtener recetas destacadas
router.get('/featured-recipes', recipeController.getFeatured);

// Obtener receta por ID
router.get('/recipe/:id', recipeController.findById);

// Buscar recetas
router.get('/search', recipeController.search);

// Crear nueva receta (requiere autenticación)
router.post('/add-recipe', authenticateToken, recipeController.create);

// Actualizar receta (requiere autenticación)
router.put('/recipe/:id', authenticateToken, recipeController.update);

// Eliminar receta (requiere autenticación)
router.delete('/recipe/:id', authenticateToken, recipeController.delete);

// Obtener recetas de un usuario
router.get('/user/:userId/recipes', authenticateToken, recipeController.findByUser);

module.exports = router;
