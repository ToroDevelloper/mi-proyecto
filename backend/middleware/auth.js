const jwt = require('jsonwebtoken');
const dbConfig = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  // Extraer el token eliminando 'Bearer ' si existe
  const token = authHeader.startsWith('Bearer ') ? 
    authHeader.slice(7) : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, dbConfig.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Error al verificar token:', err);
      return res.status(403).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
