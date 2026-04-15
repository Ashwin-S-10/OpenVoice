# OpenVoice

OpenVoice is a LAN-optimized real-time group chat app with this architecture:

- Frontend: React SPA + client-side group cache
- Backend: Spring Boot REST + WebSocket + async persistence
- Data layer: MySQL + in-memory recent-message cache

## Project Structure

- `backend/` Spring Boot application
- `frontend/` React + Vite application

## Backend (Spring Boot)

### Key Endpoints

- `GET /groups`
- `POST /groups`
- `GET /messages/{groupId}`
- WebSocket: `/ws/chat`

### WebSocket Events

- `JOIN_GROUP`
- `SEND_MESSAGE`
- `LEAVE_GROUP`

### Run Backend

1. Start MySQL using Docker Compose:

```bash
docker compose up -d mysql
```

2. Run backend:

```bash
cd backend
mvn spring-boot:run
```

3. Optional: override DB connection with env vars if you are not using default local Docker settings:

```bash
DB_HOST=localhost DB_PORT=3306 DB_NAME=openvoice DB_USER=root DB_PASSWORD=root mvn spring-boot:run
```

## Frontend (React)

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite (typically `http://localhost:5173`).

## LAN / Phone Access

1. Start backend with LAN binding enabled (`server.address=0.0.0.0` is already configured):

```bash
cd backend
DB_HOST=localhost DB_PORT=3306 DB_NAME=messenger_db DB_USER=openvoice DB_PASSWORD=openvoice123 mvn spring-boot:run
```

2. Start frontend for LAN:

A) Development (1-2 devices)

```bash
cd frontend
npm run dev:lan
```

B) Stable multi-device access (recommended)

```bash
cd frontend
npm run build:lan
npm run serve:lan
```

Note: Vite dev server is optimized for development and may become unstable with many simultaneous LAN clients.

3. Open from phone on same Wi-Fi:

- Frontend: `http://<your-laptop-ip>:5173`
- Backend: `http://<your-laptop-ip>:8080`

4. If blocked by firewall (Linux `ufw`):

```bash
sudo ufw allow 8080
sudo ufw allow 5173
```

## Runtime Flow

1. Connect frontend to backend URL (default `http://localhost:8080`).
2. Frontend fetches groups via REST.
3. Frontend connects WebSocket and joins selected group.
4. Group messages are loaded from client cache or REST.
5. Sending a message uses WebSocket broadcast, then async DB persistence.