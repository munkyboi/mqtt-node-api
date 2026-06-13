const { getPool } = require('../db');

async function insertSensorReading(reading) {
  const [result] = await getPool().query(
    `INSERT INTO sensor_readings (
      temperature,
      humidity,
      water_level,
      status,
      recorded_at
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      reading.temperature,
      reading.humidity,
      reading.water_level,
      reading.status,
      reading.recorded_at,
    ],
  );

  return result.insertId;
}

async function deleteExpiredSensorReadings(retentionMinutes) {
  await getPool().query(
    `DELETE FROM sensor_readings
     WHERE recorded_at < (UTC_TIMESTAMP() - INTERVAL ? MINUTE)`,
    [retentionMinutes],
  );
}

async function getRecentSensorReadings(retentionMinutes) {
  const [rows] = await getPool().query(
    `SELECT id, temperature, humidity, water_level, status, recorded_at, created_at
     FROM sensor_readings
     WHERE recorded_at >= (UTC_TIMESTAMP() - INTERVAL ? MINUTE)
     ORDER BY recorded_at DESC`,
    [retentionMinutes],
  );

  return rows;
}

module.exports = {
  insertSensorReading,
  deleteExpiredSensorReadings,
  getRecentSensorReadings,
};
