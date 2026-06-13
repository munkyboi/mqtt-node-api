# MQTT Node API

Subscribes to MQTT topics for relay control, DHT/water level readings, and device status.

## Topics

- `IoT /relay` publishes or receives relay commands for Arduino LED control: `ON` or `OFF`
- `IoT /sensors` receives real-time DHT and water level readings and stores only the last 5 minutes in MySQL
- `IoT /status` receives device status updates

## Expected payloads

For `IoT /sensors`:

```json
{
  "temperature": 28.4,
  "humidity": 73.2,
  "water_level": 45,
  "status": "ok",
  "recorded_at": "2026-06-13T12:30:00Z"
}
```

For `IoT /status`:

```json
{
  "status": "online",
  "ip_address": "172.18.0.5",
  "timestamp": "2026-06-13T12:30:00Z"
}
```

The service also accepts simple key-value payloads such as:

```txt
temperature=28.4,humidity=73.2,water_level=45
```

## MySQL tables

- `sensor_readings` for sensor data
- `device_status_events` for status messages

The app auto-creates database `iot_data` and these tables if they do not exist.

## Run locally

```bash
cp .env.example .env
npm install
npm start
```

## Env file safeguards

- `.env` and `.env.*` are ignored by `.gitignore`
- `.env.example` stays tracked as the safe template
- A pre-commit hook blocks commits that stage `.env` files

Install the hook with:

```bash
npm install
```

## Docker notes

If your MQTT broker and MySQL server are exposed on `206.189.95.192`, set:

```env
MQTT_URL=mqtt://206.189.95.192
MYSQL_HOST=206.189.95.192
```

If this app runs inside the same Docker Compose network, use the service names instead of the public IP.

## Health check

`GET /health`

## API endpoints

- `GET /health` returns service and last-message state
- `GET /status` returns the latest device status
- `GET /chart` returns the last 5 minutes of sensor data
- `POST /relay/:mode` publishes a relay command with `ON` or `OFF`

## Project structure

- `config/` runtime configuration
- `db/` database bootstrap and pool access
- `repositories/` MySQL query layer
- `services/` MQTT parsing and business logic
- `routes/` Express route definitions

Example relay command:

```bash
curl -X POST http://localhost:3000/relay/ON
```
