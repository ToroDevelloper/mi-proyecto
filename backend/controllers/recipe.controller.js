const Recipe = require('../models/Recipe');

// Obtener todas las recetas
exports.findAll = async (req, res) => {
  try {
    const recipes = await Recipe.findAll();
    res.json(recipes);
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener recetas destacadas
exports.getFeatured = async (req, res) => {
  try {
    const recipes = await Recipe.getFeatured(6);
    res.json(recipes);
  } catch (error) {
    console.error('Error al obtener recetas destacadas:', error);
    res.status(500).json({ error: 'Error al obtener recetas destacadas' });
  }
};

// Obtener receta por ID
exports.findById = async (req, res) => {
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
};

// Buscar recetas
exports.search = async (req, res) => {
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
};

// Crear nueva receta
exports.create = async (req, res) => {
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
      informacion_nutricional,
      user_id: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Receta creada exitosamente',
      recipe
    });
  } catch (error) {
    console.error('Error al crear receta:', error);
    res.status(500).json({ error: 'Error al crear receta' });
  }
};

// Actualizar receta
exports.update = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    // Verificar que el usuario sea el dueño de la receta
    if (recipe.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta receta' });
    }

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
    });

    res.json({
      success: true,
      message: 'Receta actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar receta:', error);
    res.status(500).json({ error: 'Error al actualizar receta' });
  }
};

// Eliminar receta
exports.delete = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    // Verificar que el usuario sea el dueño de la receta
    if (recipe.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta receta' });
    }

    await Recipe.delete(req.params.id);

    res.json({
      success: true,
      message: 'Receta eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar receta:', error);
    res.status(500).json({ error: 'Error al eliminar receta' });
  }
};

// Obtener recetas de un usuario
exports.findByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const recipes = await Recipe.findByUser(userId);
    res.json(recipes);
  } catch (error) {
    console.error('Error al obtener recetas del usuario:', error);
    res.status(500).json({ error: 'Error al obtener recetas del usuario' });
  }
};
