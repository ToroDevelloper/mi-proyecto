const db = require('../config/db');

class Recipe {
  // Obtener todas las recetas con promedio de calificaciones
  async findAll(limit = 100) {
    const query = `
      SELECT r.*, u.nombre as nombre_usuario, u.foto_url as foto_usuario,
             AVG(cr.calificacion) as promedio_calificacion,
             COUNT(cr.id) as total_votos
      FROM recetas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN comentarios_recetas cr ON r.id = cr.receta_id
      GROUP BY r.id
      ORDER BY r.fecha_creacion DESC
      LIMIT ?
    `;
    return await db.query(query, [limit]);
  }

  // Obtener receta por ID
  async findById(id) {
    const query = `
      SELECT r.*, u.nombre as nombre_usuario, u.foto_url as foto_usuario,
             AVG(cr.calificacion) as promedio_calificacion,
             COUNT(cr.id) as total_votos
      FROM recetas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN comentarios_recetas cr ON r.id = cr.receta_id
      WHERE r.id = ?
      GROUP BY r.id
    `;
    const results = await db.query(query, [id]);
    return results[0] || null;
  }

  // Crear nueva receta
  async create(recipeData, userId) {
    const { 
      nombre_receta, 
      categoria, 
      tiempo,
      ingredientes, 
      pasos, 
      imagen_url, 
      informacion_nutricional 
    } = recipeData;

    // Obtener nombre del usuario
    const user = await db.query('SELECT nombre FROM usuarios WHERE id = ?', [userId]);
    const nombreUsuario = user[0]?.nombre;

    const query = `
      INSERT INTO recetas (
        nombre_receta, categoria, tiempo, ingredientes, pasos,
        imagen_url, informacion_nutricional, usuario_id, nombre_usuario, fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await db.query(query, [
      nombre_receta,
      categoria,
      tiempo || '30',
      ingredientes,
      pasos,
      imagen_url || 'https://via.placeholder.com/300',
      informacion_nutricional || '',
      userId,
      nombreUsuario
    ]);

    return { id: result.insertId, ...recipeData };
  }

  // Actualizar receta
  async update(id, recipeData, userId) {
    // Verificar que la receta pertenece al usuario
    const existingRecipe = await this.findById(id);
    if (!existingRecipe || existingRecipe.usuario_id !== userId) {
      throw new Error('Receta no encontrada o no autorizada');
    }

    const { 
      nombre_receta, 
      categoria, 
      tiempo,
      ingredientes, 
      pasos, 
      imagen_url, 
      informacion_nutricional 
    } = recipeData;

    const query = `
      UPDATE recetas SET
        nombre_receta = ?,
        categoria = ?,
        tiempo = ?,
        ingredientes = ?,
        pasos = ?,
        imagen_url = ?,
        informacion_nutricional = ?
      WHERE id = ? AND usuario_id = ?
    `;

    await db.query(query, [
      nombre_receta,
      categoria,
      tiempo,
      ingredientes,
      pasos,
      imagen_url,
      informacion_nutricional,
      id,
      userId
    ]);

    return true;
  }

  // Eliminar receta
  async delete(id, userId) {
    // Verificar que la receta pertenece al usuario
    const existingRecipe = await this.findById(id);
    if (!existingRecipe || existingRecipe.usuario_id !== userId) {
      throw new Error('Receta no encontrada o no autorizada');
    }

    // Eliminar comentarios relacionados primero
    await db.query('DELETE FROM comentarios_recetas WHERE receta_id = ?', [id]);
    
    const query = 'DELETE FROM recetas WHERE id = ? AND usuario_id = ?';
    await db.query(query, [id, userId]);
    return true;
  }

  // Obtener recetas de un usuario
  async findByUserId(userId) {
    const query = `
      SELECT r.*, u.nombre as nombre_usuario
      FROM recetas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.usuario_id = ?
      ORDER BY r.fecha_creacion DESC
    `;
    return await db.query(query, [userId]);
  }

  // Buscar recetas
  async search(term) {
    const searchTerm = `%${term}%`;
    const query = `
      SELECT r.*, u.nombre as nombre_usuario, u.foto_url as foto_usuario,
             AVG(cr.calificacion) as promedio_calificacion,
             COUNT(cr.id) as total_votos
      FROM recetas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN comentarios_recetas cr ON r.id = cr.receta_id
      WHERE r.nombre_receta LIKE ? 
         OR r.ingredientes LIKE ?
         OR r.categoria LIKE ?
      GROUP BY r.id
      ORDER BY r.fecha_creacion DESC
    `;
    return await db.query(query, [searchTerm, searchTerm, searchTerm]);
  }

  // Obtener recetas destacadas
  async getFeatured(limit = 6) {
    const query = `
      SELECT r.*, u.nombre as nombre_usuario, u.foto_url as foto_usuario,
             AVG(cr.calificacion) as promedio_calificacion,
             COUNT(cr.id) as total_votos
      FROM recetas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN comentarios_recetas cr ON r.id = cr.receta_id
      GROUP BY r.id
      HAVING promedio_calificacion IS NOT NULL
      ORDER BY promedio_calificacion DESC, total_votos DESC
      LIMIT ?
    `;
    return await db.query(query, [limit]);
  }
}

module.exports = new Recipe();
