# ⚡ PulsePoll Live Polling App

> A modern, real-time polling application built for live audience engagement.
> Built with **React + Tailwind CSS · Go (Gin) · MongoDB · Redis Pub/Sub + WebSockets**.

---

## Architecture

```
Browser (React)
   │  WebSocket (ws://localhost:8080/ws)
   │  REST (http://localhost:8080/api/v1)
   ▼
Go Gin Server
   ├── POST /api/v1/polls/vote
   │     └─► MongoDB  (atomic $inc on option.votes)
   │     └─► Redis PUBLISH "poll_updates" {poll_id, options}
   │
   └── GET /ws  (WebSocket hub)
         └─► Redis SUBSCRIBE "poll_updates"
               └─► fan-out to all connected browsers
```

## Project Structure

```
live-polling-app/
├── docker-compose.yml          Full stack (Mongo + Redis + Go + React)
│
├── backend/
│   ├── main.go                 Gin server, graceful shutdown, routes
│   ├── go.mod / go.sum
│   ├── Dockerfile
│   ├── .env.example
│   ├── models/poll.go          Poll & VotePayload types
│   ├── db/mongo.go             MongoDB connection helper
│   ├── redis/client.go         Redis client + Pub/Sub helpers
│   └── handlers/poll.go        HTTP handlers + WebSocket hub
│
└── frontend/
    ├── src/
    │   ├── index.js            React entry point
    │   ├── index.css           ← Global live dashboard design system
    │   ├── PollDashboard.jsx   ← Main dashboard (real-time WS integration)
    │   ├── components/
    │   │   ├── PollCard.jsx         ← Floating glass poll card + progress bars
    │   │   ├── CreatePollModal.jsx  ← Create poll modal
    │   │   └── ConnectionStatus.jsx ← WS status badge
    │   ├── hooks/useWebSocket.js    ← WS lifecycle hook with auto-reconnect
    │   ├── api/polls.js             ← REST API client
    │   └── utils/nanoid.js          ← Crypto random ID
    ├── tailwind.config.js      ← Dashboard design tokens
    ├── postcss.config.js
    ├── Dockerfile
    └── nginx.conf
```

## Quick Start — Local Development

### Prerequisites
- Node.js 18+, Go 1.22+, MongoDB, Redis running locally

### 1. Backend
```bash
cd backend
cp .env.example .env
go mod tidy
go run .
# Server → http://localhost:8080
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
# Dev server → http://localhost:3000
```

### 3. Full Stack with Docker Compose
```bash
docker compose up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:8080
```

## REST API Reference

| Method | Endpoint                  | Description           |
|--------|---------------------------|-----------------------|
| GET    | `/api/v1/polls`           | List all active polls |
| POST   | `/api/v1/polls`           | Create a new poll     |
| GET    | `/api/v1/polls/:id`       | Get a single poll     |
| POST   | `/api/v1/polls/vote`      | Cast a vote           |
| GET    | `/ws`                     | WebSocket connection  |
| GET    | `/health`                 | Health check          |

### Example: Create a Poll
```bash
curl -X POST http://localhost:8080/api/v1/polls \
  -H 'Content-Type: application/json' \
  -d '{
    "question": "Best zero-gravity snack?",
    "options": [
      {"id": "opt-1", "text": "Floating Noodles"},
      {"id": "opt-2", "text": "Space Ice Cream"},
      {"id": "opt-3", "text": "Freeze-dried Mango"}
    ]
  }'
```

### Example: Cast a Vote
```bash
curl -X POST http://localhost:8080/api/v1/polls/vote \
  -H 'Content-Type: application/json' \
  -d '{"poll_id": "<ObjectID>", "option_id": "opt-2"}'
```

## Real-Time Flow (Step by Step)

1. Browser opens `ws://localhost:8080/ws` — registered in the **WS Hub**.
2. Another browser POSTs `/api/v1/polls/vote`.
3. Go handler atomically increments `options.$.votes` in **MongoDB**.
4. Go handler fetches updated poll → marshals to JSON → **`PUBLISH poll_updates <json>`** to Redis.
5. The `StartRedisSubscriber` goroutine receives the message and calls **`hub.broadcast()`**.
6. Every connected browser's `useWebSocket` hook receives the payload → **React state patches** the matching poll's options → progress bars animate to new percentages.

## Design System Tokens

| Token | Value | Usage |
|---|---|---|
| `space-void` | `#020408` | Page background |
| `neon-cyan` | `#00f5ff` | Primary glow / CTA |
| `neon-purple` | `#a855f7` | Secondary accent |
| `neon-magenta` | `#ff00c8` | LIVE badge / alerts |
| `glass-panel` | CSS class | All floating card containers |
| `btn-neon-cyan` | CSS class | Primary action buttons |
| `animate-float-bob` | Tailwind | Slow 4s floating bob |
| `animate-glow-pulse` | Tailwind | Pulsing neon ring |
