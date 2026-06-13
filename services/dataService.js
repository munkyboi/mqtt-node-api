const { SENSOR_RETENTION_MINUTES } = require('../config/env');
const sensorRepository = require('../repositories/sensorRepository');
const statusRepository = require('../repositories/statusRepository');
const state = require('./state');

async function saveReading(reading) {
  const insertId = await sensorRepository.insertSensorReading(reading);

  state.markLastMessageAt();
  state.setLastInsertId(insertId);

  await sensorRepository.deleteExpiredSensorReadings(SENSOR_RETENTION_MINUTES);

  console.log('Stored reading', {
    id: insertId,
    temperature: reading.temperature,
    humidity: reading.humidity,
    water_level: reading.water_level,
    recorded_at: reading.recorded_at.toISOString(),
  });
}

async function saveStatus(statusEvent) {
  const insertId = await statusRepository.insertStatusEvent(statusEvent);

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
