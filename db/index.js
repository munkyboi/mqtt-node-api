const mysql = require('mysql2/promise');
const { MYSQL_CONFIG } = require('../config/env');

let pool;

async function ensureDatabase() {
  const bootstrapConnection = await mysql.createConnection({
    host: MYSQL_CONFIG.host,
    port: MYSQL_CONFIG.port,
    user: MYSQL_CONFIG.user,
    password: MYSQL_CONFIG.password,
  });

  await bootstrapConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${MYSQL_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await bootstrapConnection.end();

  pool = mysql.createPool(MYSQL_CONFIG);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      topic VARCHAR(255) NOT NULL,
      device_id VARCHAR(100) NULL,
      temperature DECIMAL(10, 2) NULL,
      humidity DECIMAL(10, 2) NULL,
      water_level DECIMAL(10, 2) NULL,
      status VARCHAR(100) NULL,
      raw_payload JSON NULL,
      reading_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_sensor_readings_topic (topic),
      KEY idx_sensor_readings_device_id (device_id),
      KEY idx_sensor_readings_reading_at (reading_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS device_status_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      topic VARCHAR(255) NOT NULL,
      device_id VARCHAR(100) NULL,
      status VARCHAR(100) NOT NULL,
      ip_address VARCHAR(64) NULL,
      raw_payload JSON NULL,
      updated_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_device_status_device_id (device_id),
      KEY idx_device_status_updated_at (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool is not initialized');
  }

  return pool;
}

module.exports = {
  ensureDatabase,
  getPool,
};
