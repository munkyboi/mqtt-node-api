const { getPool } = require('../db');

async function insertStatusEvent(statusEvent, rawPayload) {
  const [result] = await getPool().query(
    `INSERT INTO device_status_events (
      topic,
      device_id,
      status,
      ip_address,
      raw_payload,
      updated_at
    ) VALUES (?, ?, ?, ?, CAST(? AS JSON), ?)`,
    [
      statusEvent.topic,
      statusEvent.device_id,
      statusEvent.status,
      statusEvent.ip_address,
      rawPayload,
      statusEvent.updated_at,
    ],
  );

  return result.insertId;
}

async function getLatestStatusEvent() {
  const [rows] = await getPool().query(
    `SELECT id, topic, device_id, status, ip_address, updated_at, created_at
     FROM device_status_events
     ORDER BY updated_at DESC
     LIMIT 1`,
  );

  return rows[0] || null;
}

module.exports = {
  insertStatusEvent,
  getLatestStatusEvent,
};
