const { SENSOR_RETENTION_MINUTES } = require('../config/env');
const sensorRepository = require('../repositories/sensorRepository');
const statusRepository = require('../repositories/statusRepository');
const state = require('./state');

function toJsonValue(rawPayload) {
  try {
    return JSON.stringify(JSON.parse(rawPayload));
  } catch {
    return JSON.stringify({ raw: rawPayload });
  }
}

async function saveReading(reading) {
  const insertId = await sensorRepository.insertSensorReading(reading, toJsonValue(reading.raw_payload));

  state.markLastMessageAt();
  state.setLastInsertId(insertId);

  await sensorRepository.deleteExpiredSensorReadings(SENSOR_RETENTION_MINUTES);

  console.log('Stored reading', {
    id: insertId,
    topic: reading.topic,
    device_id: reading.device_id,
    temperature: reading.temperature,
    humidity: reading.humidity,
    water_level: reading.water_level,
    reading_at: reading.reading_at.toISOString(),
  });
}

async function saveStatus(statusEvent) {
  const insertId = await statusRepository.insertStatusEvent(statusEvent, toJsonValue(statusEvent.raw_payload));

  state.markLastMessageAt();
  state.setLastDeviceStatus({
    id: insertId,
    ...statusEvent,
  });

  console.log('Stored device status', {
    id: insertId,
    ...state.getState().lastDeviceStatus,
  });
}

async function getChartData() {
  return sensorRepository.getRecentSensorReadings(SENSOR_RETENTION_MINUTES);
}

async function getLatestStatus() {
  return statusRepository.getLatestStatusEvent();
}

module.exports = {
  saveReading,
  saveStatus,
  getChartData,
  getLatestStatus,
};
