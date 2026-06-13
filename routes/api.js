const express = require('express');
const { SENSOR_RETENTION_MINUTES, MQTT_TOPICS } = require('../config/env');
const { getPool } = require('../db');
const dataService = require('../services/dataService');
const mqttService = require('../services/mqttService');
const state = require('../services/state');

const router = express.Router();

router.get('/health', async (_req, res) => {
  try {
    await getPool().query('SELECT 1');
    const currentState = state.getState();

    res.json({
      status: 'ok',
      sensorRetentionMinutes: SENSOR_RETENTION_MINUTES,
      lastMessageAt: currentState.lastMessageAt,
      lastInsertId: currentState.lastInsertId,
      lastRelayCommand: currentState.lastRelayCommand,
      lastDeviceStatus: currentState.lastDeviceStatus,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

router.get('/chart', async (_req, res) => {
  try {
    const rows = await dataService.getChartData();

    res.json({
      retentionMinutes: SENSOR_RETENTION_MINUTES,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/status', async (_req, res) => {
  try {
    const latestStatus = await dataService.getLatestStatus();

    res.json({
      data: latestStatus,
      lastDeviceStatus: state.getState().lastDeviceStatus,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/relay/:mode', (req, res) => {
  try {
    mqttService.publishRelayCommand(req.params.mode);
    res.json({
      status: 'ok',
      command: state.getState().lastRelayCommand,
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
