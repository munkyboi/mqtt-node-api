const { TOPIC_NAMES } = require('../config/env');

function normalizeTopic(topic) {
  return topic.replace(/\s+/g, ' ').trim();
}

function isTopic(topic, expectedTopic) {
  return normalizeTopic(topic) === normalizeTopic(expectedTopic);
}

function safeNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseKeyValuePayload(rawPayload) {
  const pairs = rawPayload
    .split(/[;,]/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => segment.split(/[:=]/).map((part) => part.trim()));

  if (!pairs.length || pairs.some((pair) => pair.length < 2)) {
    return null;
  }

  return Object.fromEntries(pairs.map(([key, ...rest]) => [key, rest.join(':')]));
}

function normalizeDate(value) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function extractReading(payload) {
  return {
    temperature: safeNumber(payload.temperature ?? payload.temp),
    humidity: safeNumber(payload.humidity),
    water_level: safeNumber(
      payload.water_level ?? payload.waterLevel ?? payload.level ?? payload.distance,
    ),
    status: payload.status || null,
    recorded_at: normalizeDate(
      payload.timestamp || payload.recorded_at || payload.recordedAt || payload.reading_at || payload.readingAt || null,
    ),
  };
}

function extractStatus(payload, rawPayload) {
  return {
    status: payload.status || payload.state || rawPayload,
    ip_address: payload.ip_address || payload.ipAddress || null,
    updated_at: normalizeDate(payload.timestamp || payload.updated_at || payload.updatedAt || null),
  };
}

function extractRelayCommand(payload, rawPayload) {
  const command = payload.command || payload.state || payload.relay || rawPayload;
  const normalized = String(command).trim().toUpperCase();

  return {
    command: normalized === '1' ? 'ON' : normalized === '0' ? 'OFF' : normalized,
    sent_at: normalizeDate(payload.timestamp || payload.sent_at || payload.sentAt || null),
  };
}

function parseMessage(topic, messageBuffer) {
  const rawPayload = messageBuffer.toString().trim();
  let payload;

  try {
    payload = JSON.parse(rawPayload);
  } catch {
    payload = parseKeyValuePayload(rawPayload);
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    payload = {};
  }

  if (isTopic(topic, TOPIC_NAMES.sensors)) {
    return { kind: 'sensor', data: extractReading(payload) };
  }

  if (isTopic(topic, TOPIC_NAMES.status)) {
    return { kind: 'status', data: extractStatus(payload, rawPayload) };
  }

  if (isTopic(topic, TOPIC_NAMES.relay)) {
    return { kind: 'relay', data: extractRelayCommand(payload, rawPayload) };
  }

  return { kind: 'unknown', data: { topic: normalizeTopic(topic) } };
}

module.exports = {
  parseMessage,
};
