# VedaAI Backend

Node.js + Express + TypeScript backend for the AI Assessment Creator.

## Architecture

```
src/
├── config/          # DB + Redis connections
├── controllers/
│   ├── auth/        # Auth controller
│   ├── users/       # User controller
│   └── assignments/ # Assignment controller
├── middlewares/     # Auth, validation, error, upload
├── models/          # Mongoose schemas (User, Assignment)
├── queues/          # BullMQ queue definitions
├── routes/
│   ├── auth/        # POST /api/auth/*
│   ├── users/       # /api/users/*
│   └── assignments/ # /api/assignments/*
├── services/        # AI generation service (Anthropic)
├── types/           # Shared TypeScript types
├── websocket/       # WebSocket manager
├── workers/         # BullMQ worker process
├── app.ts           # Express app
└── server.ts        # HTTP server + bootstrap
```

## Flow

1. `POST /api/assignments` → creates DB record → adds BullMQ job
2. Worker picks job → calls Anthropic API → updates progress via Redis pub/sub
3. WebSocket relays progress/completion to connected frontend client
4. Frontend polls `/api/assignments/:id/status` or listens via WS

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/users/profile | Yes | Get profile |
| PATCH | /api/users/profile | Yes | Update name |
| PATCH | /api/users/change-password | Yes | Change password |
| POST | /api/assignments | Yes | Create + queue |
| GET | /api/assignments | Yes | List (paginated) |
| GET | /api/assignments/:id | Yes | Get one (cached) |
| GET | /api/assignments/:id/status | Yes | Job status |
| POST | /api/assignments/:id/regenerate | Yes | Regenerate |
| DELETE | /api/assignments/:id | Yes | Delete |

**WebSocket:** `ws://localhost:5000/ws?token=<jwt>`

## Setup

See installation steps below.
