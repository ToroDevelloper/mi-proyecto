const db = require('../config/db');

class Comment {
  // Obtener comentarios de una receta
  async findByRecipeId(recipeId) {
    const query = `
      SELECT c.*, u.nombre as nombre_usuario, u.foto_url as foto_usuario
      FROM comentarios_recetas c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.receta_id = ?
      ORDER BY c.fecha_comentario DESC
    `;
    return await db.query(query, [recipeId]);
  }

  // Crear comentario
  async create(commentData) {
    const { receta_id, usuario_id, comentario, calificacion } = commentData;
    
    // Obtener nombre del usuario
    const user = await db.query('SELECT nombre FROM usuarios WHERE id = ?', [usuario_id]);
    const nombreUsuario = user[0]?.nombre;

    const query = `
      INSERT INTO comentarios_recetas (receta_id, usuario_id, nombre_usuario, comentario, calificacion, fecha_comentario)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const result = await db.query(query, [receta_id, usuario_id, nombreUsuario, comentario, calificacion]);
    return { id: result.insertId, ...commentData, nombre_usuario: nombreUsuario };
  }

  // Actualizar comentario
  async update(id, commentData, userId) {
    const { comentario, calificacion } = commentData;
    
    const query = `
      UPDATE comentarios_recetas SET comentario = ?, calificacion = ?
      WHERE id = ? AND usuario_id = ?
    `;
    
    const result = await db.query(query, [comentario, calificacion, id, userId]);
    return result.affectedRows > 0;
  }

  // Eliminar comentario
  async delete(id, userId) {
    const query = 'DELETE FROM comentarios_recetas WHERE id = ? AND usuario_id = ?';
    const result = await db.query(query, [id, userId]);
    return result.affectedRows > 0;
  }

  // Obtener respuestas a un comentario
  async getReplies(commentId) {
    const query = `
      SELECT r.*, u.nombre as nombre_usuario, u.foto_url as foto_usuario
      FROM respuestas_comentarios_recetas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.comentario_id = ?
      ORDER BY r.fecha_respuesta ASC
    `;
    return await db.query(query, [commentId]);
  }

  // Crear respuesta a comentario
  async createReply(replyData) {
    const { comentario_id, usuario_id, respuesta } = replyData;
    
    // Obtener nombre del usuario
    const user = await db.query('SELECT nombre FROM usuarios WHERE id = ?', [usuario_id]);
    const nombreUsuario = user[0]?.nombre;

    const query = `
      INSERT INTO respuestas_comentarios_recetas (comentario_id, usuario_id, nombre_usuario, respuesta, fecha_respuesta)
      VALUES (?, ?, ?, ?, NOW())
    `;

    const result = await db.query(query, [comentario_id, usuario_id, nombreUsuario, respuesta]);
    return { id: result.insertId, ...replyData, nombre_usuario: nombreUsuario };
  }

  // Eliminar respuesta
  async deleteReply(id, userId) {
    const query = 'DELETE FROM respuestas_comentarios_recetas WHERE id = ? AND usuario_id = ?';
    const result = await db.query(query, [id, userId]);
    return result.affectedRows > 0;
  }
}

module.exports = new Comment();
