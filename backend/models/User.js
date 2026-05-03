const bcrypt = require('bcrypt');
const db = require('../config/db');

class User {
  // Obtener usuario por email
  async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    const results = await db.query(query, [email]);
    return results[0] || null;
  }

  // Obtener usuario por ID
  async findById(id) {
    const query = 'SELECT id, nombre, email, foto_url, fecha_registro FROM usuarios WHERE id = ?';
    const results = await db.query(query, [id]);
    return results[0] || null;
  }

  // Crear nuevo usuario
  async create(userData) {
    const { nombre, email, password, securityQuestion, securityAnswer } = userData;
    
    // Verificar si el usuario ya existe
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error('El correo ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO usuarios (nombre, email, password, security_question, security_answer)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(query, [nombre, email, hashedPassword, securityQuestion, securityAnswer]);
    return { id: result.insertId, nombre, email };
  }

  // Actualizar perfil de usuario
  async updateProfile(userId, updateData) {
    const { nombre, email } = updateData;
    
    const query = 'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?';
    await db.query(query, [nombre, email, userId]);
    
    // Actualizar nombre en todas las recetas del usuario
    await db.query('UPDATE recetas SET nombre_usuario = ? WHERE usuario_id = ?', [nombre, userId]);
    
    return true;
  }

  // Actualizar contraseña
  async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE usuarios SET password = ? WHERE id = ?';
    await db.query(query, [hashedPassword, userId]);
    return true;
  }

  // Eliminar usuario
  async delete(userId) {
    // Primero eliminar recetas y comentarios relacionados
    await db.query('DELETE FROM comentarios_recetas WHERE usuario_id = ?', [userId]);
    await db.query('DELETE FROM recetas WHERE usuario_id = ?', [userId]);
    
    const query = 'DELETE FROM usuarios WHERE id = ?';
    await db.query(query, [userId]);
    return true;
  }

  // Obtener pregunta de seguridad
  async getSecurityQuestion(email) {
    const query = 'SELECT security_question FROM usuarios WHERE email = ?';
    const results = await db.query(query, [email]);
    return results[0]?.security_question || null;
  }

  // Verificar respuesta de seguridad
  async verifySecurityAnswer(email, answer) {
    const query = 'SELECT security_answer FROM usuarios WHERE email = ?';
    const results = await db.query(query, [email]);
    
    if (!results[0]) {
      return false;
    }
    
    return results[0].security_answer.toLowerCase() === answer.toLowerCase();
  }

  // Actualizar foto de perfil
  async updateProfilePhoto(userId, photoUrl) {
    const query = 'UPDATE usuarios SET foto_url = ? WHERE id = ?';
    await db.query(query, [photoUrl, userId]);
    return true;
  }
}

module.exports = new User();
