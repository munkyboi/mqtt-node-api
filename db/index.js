const mysql = require('mysql2/promise');
const { MYSQL_CONFIG } = require('../config/env');

let pool;

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = ?
       AND table_name = ?
       AND column_name = ?
     LIMIT 1`,
    [MYSQL_CONFIG.database, tableName, columnName],
  );

  return rows.length > 0;
}

async function indexExists(tableName, indexName) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.statistics
     WHERE table_schema = ?
       AND table_name = ?
       AND index_name = ?
     LIMIT 1`,
    [MYSQL_CONFIG.database, tableName, indexName],
  );

  return rows.length > 0;
}

async function ensureSensorReadingColumns() {
  const sensorColumnDefinitions = {
    temperature: 'DECIMAL(10, 2) NULL',
    humidity: 'DECIMAL(10, 2) NULL',
    water_level: 'DECIMAL(10, 2) NULL',
    status: 'VARCHAR(100) NULL',
    recorded_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
  };

  for (const [columnName, definition] of Object.entries(sensorColumnDefinitions)) {
    if (!(await columnExists('sensor_readings', columnName))) {
      await pool.query(
        `ALTER TABLE sensor_readings ADD COLUMN ${columnName} ${definition}`,
      );
    }
  }

  if (await columnExists('sensor_readings', 'reading_at')) {
    await pool.query(
      `UPDATE sensor_readings
       SET recorded_at = reading_at
       WHERE recorded_at IS NULL OR recorded_at = '1970-01-01 00:00:00'`,
    );
    await pool.query(`ALTER TABLE sensor_readings DROP COLUMN reading_at`);
  }

  for (const columnName of ['topic', 'device_id', 'raw_payload']) {
    if (await columnExists('sensor_readings', columnName)) {
      await pool.query(`ALTER TABLE sensor_readings DROP COLUMN ${columnName}`);
    }
  }

  for (const indexName of [
    'idx_sensor_readings_topic',
    'idx_sensor_readings_device_id',
    'idx_sensor_readings_reading_at',
  ]) {
    if (await indexExists('sensor_readings', indexName)) {
      await pool.query(`ALTER TABLE sensor_readings DROP INDEX ${indexName}`);
    }
  }

  if (!(await indexExists('sensor_readings', 'idx_sensor_readings_recorded_at'))) {
    await pool.query(
      `ALTER TABLE sensor_readings
       ADD INDEX idx_sensor_readings_recorded_at (recorded_at)`,
    );
  }
}

async function ensureDeviceStatusColumns() {
  const statusColumnDefinitions = {
    status: 'VARCHAR(100) NOT NULL',
    ip_address: 'VARCHAR(64) NULL',
    updated_at: 'DATETIME NOT NULL',
  };

  for (const [columnName, definition] of Object.entries(statusColumnDefinitions)) {
    if (!(await columnExists('device_status_events', columnName))) {
      await pool.query(
        `ALTER TABLE device_status_events ADD COLUMN ${columnName} ${definition}`,
      );
    }
  }

  for (const columnName of ['topic', 'device_id', 'raw_payload']) {
    if (await columnExists('device_status_events', columnName)) {
      await pool.query(`ALTER TABLE device_status_events DROP COLUMN ${columnName}`);
    }
  }

  if (await indexExists('device_status_events', 'idx_device_status_device_id')) {
    await pool.query(`ALTER TABLE device_status_events DROP INDEX idx_device_status_device_id`);
  }
}

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

  await ensureSensorReadingColumns();
  await ensureDeviceStatusColumns();
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
