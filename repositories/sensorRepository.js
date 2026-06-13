const { getPool } = require('../db');

async function insertSensorReading(reading, rawPayload) {
  const [result] = await getPool().query(
    `INSERT INTO sensor_readings (
      topic,
      device_id,
      temperature,
      humidity,
      water_level,
      status,
      raw_payload,
      reading_at
    ) VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?)`,
    [
      reading.topic,
      reading.device_id,
      reading.temperature,
      reading.humidity,
      reading.water_level,
      reading.status,
      rawPayload,
      reading.reading_at,
    ],
  );

  return result.insertId;
}

async function deleteExpiredSensorReadings(retentionMinutes) {
  await getPool().query(
    `DELETE FROM sensor_readings
     WHERE reading_at < (UTC_TIMESTAMP() - INTERVAL ? MINUTE)`,
    [retentionMinutes],
  );
}

async function getRecentSensorReadings(retentionMinutes) {
  const [rows] = await getPool().query(
    `SELECT id, topic, device_id, temperature, humidity, water_level, status, reading_at, created_at
     FROM sensor_readings
     WHERE reading_at >= (UTC_TIMESTAMP() - INTERVAL ? MINUTE)
     ORDER BY reading_at DESC`,
    [retentionMinutes],
  );

  return rows;
}

module.exports = {
  insertSensorReading,
  deleteExpiredSensorReadings,
  getRecentSensorReadings,
};
