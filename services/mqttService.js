const mqtt = require('mqtt');
const { MQTT_URL, MQTT_TOPICS, TOPIC_NAMES } = require('../config/env');
const { parseMessage } = require('./messageParser');
const dataService = require('./dataService');
const state = require('./state');

let client;

function recordRelayCommand(relayCommand) {
  state.markLastMessageAt();
  state.setLastRelayCommand(relayCommand);
  console.log('Received relay command', state.getState().lastRelayCommand);
}

function publishRelayCommand(command) {
  if (!client) {
    throw new Error('MQTT client is not connected');
  }

  const normalized = String(command).trim().toUpperCase();
  if (!['ON', 'OFF'].includes(normalized)) {
    throw new Error('Relay command must be ON or OFF');
  }

  client.publish(TOPIC_NAMES.relay, normalized);
  recordRelayCommand({
    topic: TOPIC_NAMES.relay,
    raw_payload: normalized,
    command: normalized,
    device_id: null,
    sent_at: new Date(),
  });
}

function startMqttSubscriber() {
  client = mqtt.connect(MQTT_URL, {
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    clientId: process.env.MQTT_CLIENT_ID || `mqtt-node-api-${Math.random().toString(16).slice(2, 10)}`,
    reconnectPeriod: Number(process.env.MQTT_RECONNECT_MS || 5000),
  });

  client.on('connect', () => {
    console.log(`Connected to MQTT broker: ${MQTT_URL}`);

    for (const topic of MQTT_TOPICS) {
      client.subscribe(topic, (error) => {
        if (error) {
          console.error(`Failed to subscribe to ${topic}`, error);
          return;
        }

        console.log(`Subscribed to topic: ${topic}`);
      });
    }
  });

  client.on('reconnect', () => {
    console.log('Reconnecting to MQTT broker');
  });

  client.on('error', (error) => {
    console.error('MQTT error', error);
  });

  client.on('message', async (topic, message) => {
    try {
      const parsedMessage = parseMessage(topic, message);

      if (parsedMessage.kind === 'sensor') {
        await dataService.saveReading(parsedMessage.data);
        return;
      }

      if (parsedMessage.kind === 'status') {
        await dataService.saveStatus(parsedMessage.data);
        return;
      }

      if (parsedMessage.kind === 'relay') {
        recordRelayCommand(parsedMessage.data);
        return;
      }

      console.log('Ignored message from unsupported topic', parsedMessage.data);
    } catch (error) {
      console.error('Failed to process MQTT message', {
        topic,
        payload: message.toString(),
        error: error.message,
      });
    }
  });
}

module.exports = {
  startMqttSubscriber,
  publishRelayCommand,
};
