const mysql = require('mysql2');
require('dotenv').config();

// Configuración de la conexión
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Promisificar las consultas
const promisePool = pool.promise();

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    throw error;
  }
};

module.exports = {
  pool: promisePool,
  testConnection
};
