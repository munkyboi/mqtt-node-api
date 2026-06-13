const { getPool } = require('../db');

async function insertStatusEvent(statusEvent) {
  const [result] = await getPool().query(
    `INSERT INTO device_status_events (
      status,
      ip_address,
      updated_at
    ) VALUES (?, ?, ?)`,
    [
      statusEvent.status,
      statusEvent.ip_address,
      statusEvent.updated_at,
    ],
  );

  return result.insertId;
}

async function getLatestStatusEvent() {
  const [rows] = await getPool().query(
    `SELECT id, status, ip_address, updated_at, created_at
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
