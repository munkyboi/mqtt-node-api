const PORT = Number(process.env.PORT || 3000);
const MQTT_URL = process.env.MQTT_URL || 'mqtt://206.189.95.192';
const MQTT_TOPICS = (process.env.MQTT_TOPICS || 'IoT /relay,IoT /sensors,IoT /status')
  .split(',')
  .map((topic) => topic.trim())
  .filter(Boolean);
const SENSOR_RETENTION_MINUTES = Number(process.env.SENSOR_RETENTION_MINUTES || 5);

const TOPIC_NAMES = {
  relay: 'IoT /relay',
  sensors: 'IoT /sensors',
  status: 'IoT /status',
};

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || '206.189.95.192',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'iot_data',
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  queueLimit: 0,
};

module.exports = {
  PORT,
  MQTT_URL,
  MQTT_TOPICS,
  SENSOR_RETENTION_MINUTES,
  TOPIC_NAMES,
  MYSQL_CONFIG,
};
