const mysql = require('mysql');
const dbConfig = require('../config/database');

// Crear pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promisificar las consultas para usar async/await
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) {
        console.error('Error en consulta SQL:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

module.exports = {
  pool,
  query
};
