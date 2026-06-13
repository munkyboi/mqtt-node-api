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
      temperature DECIMAL(10, 2) NULL,
      humidity DECIMAL(10, 2) NULL,
      water_level DECIMAL(10, 2) NULL,
      status VARCHAR(100) NULL,
      recorded_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_sensor_readings_recorded_at (recorded_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS device_status_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      status VARCHAR(100) NOT NULL,
      ip_address VARCHAR(64) NULL,
      updated_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_device_status_updated_at (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    ALTER TABLE sensor_readings
      ADD COLUMN IF NOT EXISTS recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      DROP COLUMN IF EXISTS topic,
      DROP COLUMN IF EXISTS device_id,
      DROP COLUMN IF EXISTS raw_payload,
      DROP COLUMN IF EXISTS reading_at
  `);

  await pool.query(`
    ALTER TABLE device_status_events
      DROP COLUMN IF EXISTS topic,
      DROP COLUMN IF EXISTS device_id,
      DROP COLUMN IF EXISTS raw_payload
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
