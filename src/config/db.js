const mysql = require('mysql2/promise');

function createPoolFromEnv(env = process.env) {
  return mysql.createPool({
    host: env.MYSQL_HOST || 'localhost',
    port: Number(env.MYSQL_PORT || 3306),
    user: env.MYSQL_USER || 'root',
    password: env.MYSQL_PASSWORD || '',
    database: env.MYSQL_DATABASE || 'adultos_mayores_practica',
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true
  });
}

module.exports = { createPoolFromEnv };
