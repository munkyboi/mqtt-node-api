require('dotenv').config();

const express = require('express');
const { PORT } = require('./config/env');
const { ensureDatabase } = require('./db');
const mqttService = require('./services/mqttService');
const apiRoutes = require('./routes/api');

const app = express();
app.use(express.json());
app.use(apiRoutes);

async function start() {
  await ensureDatabase();
  mqttService.startMqttSubscriber();

  app.listen(PORT, () => {
    console.log(`HTTP server listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Application failed to start', error);
  process.exit(1);
});
