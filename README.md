# VedaAI - AI Assessment Creator

A full stack application that lets teachers create assignments and generate structured question papers using AI.

---

## Features

- Create assignments with subject, grade, topic, due date, and question type configuration
- Upload reference material (PDF, TXT, DOC) to guide question generation
- AI-generated question papers structured into sections (Section A, B, etc.)
- Each question tagged with difficulty (Easy, Moderate, Challenging) and marks
- Real-time generation progress via WebSocket
- Download generated paper as PDF
- Regenerate paper with one click
- JWT-based authentication
- Background job processing so the API never blocks
- Redis caching for generated papers

---

## Architecture

The system is split into three parts: a frontend SPA, a backend API server, and a background worker. They communicate over HTTP and WebSockets, with Redis acting as both a job queue and a pub/sub message bus between the API and the worker.

```
Browser
  |
  |-- HTTP (REST) --> Express API (Node.js)
  |-- WebSocket   --> Express API (Node.js)
                          |
                          |-- BullMQ job --> Redis Queue
                          |
                      BullMQ Worker (separate process)
                          |
                          |-- Anthropic API (Claude) --> generates paper
                          |-- MongoDB --> stores result
                          |-- Redis pub/sub --> notifies API
                          |
                      API receives pub/sub message
                          |
                      WebSocket --> Browser (progress + result)
```

The worker is a completely separate Node.js process. This means generation jobs survive API restarts and the API stays responsive under load.

---

## Tech Stack

**Frontend**
- React 19 with TypeScript
- TanStack Start (SSR framework) + TanStack Router
- Zustand for state management
- Tailwind CSS + shadcn/ui components
- jsPDF + html2canvas for PDF export
- Native WebSocket client with auto-reconnect

**Backend**
- Node.js + Express with TypeScript
- MongoDB + Mongoose for storing assignments and results
- Redis (ioredis) for caching and pub/sub
- BullMQ for background job queue
- WebSocket (ws) for real-time updates
- Zod for request validation
- JWT (jsonwebtoken) for authentication
- Multer for file uploads

**AI**
- Anthropic Claude (claude-sonnet) via official SDK
- Structured prompt engineering with JSON output parsing
- Fallback validation and normalization of AI response

---

## Folder Structure

**Backend**
```
veda-ai-backend/
  src/
    config/          db.ts, redis.ts
    controllers/
      auth/          auth.controller.ts
      users/         user.controller.ts
      assignments/   assignment.controller.ts
    middlewares/     auth, error, validate, upload
    models/          User.ts, Assignment.ts
    queues/          assessment.queue.ts
    routes/
      auth/          auth.ts
      users/         user.ts
      assignments/   assignment.ts
    services/        ai.service.ts
    types/           index.ts
    websocket/       ws.manager.ts
    workers/         assessment.worker.ts
    app.ts
    server.ts
```

**Frontend**
```
ai-assessment-creator-main/
  src/
    components/
      ui/            shadcn component library
      layout/        AppShell, Sidebar, TopBar
    lib/
      api.ts         fetch wrapper with JWT injection
      auth.ts        login/register/token helpers
      store.ts       Zustand store (all app state + API calls)
      ws.ts          WebSocket client with reconnect
    routes/
      __root.tsx
      index.tsx
      assignments.index.tsx
      assignments.new.tsx
      assignments.output.tsx
```

---

## Setup and Running Locally

### Prerequisites

- Node.js 18+
- MongoDB running locally (`sudo systemctl start mongodb`)
- Redis running locally (`sudo systemctl start redis`)
- Anthropic API key

### Backend

```bash
cd veda-ai-backend
cp .env.example .env
```

Edit `.env`:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/veda-ai
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=your_random_secret_here
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=sk-ant-your-key-here
CORS_ORIGIN=http://localhost:8080
```

```bash
npm install

# Terminal 1 - API server
npm run dev

# Terminal 2 - BullMQ worker (must run separately)
npm run worker
```

### Frontend

```bash
cd ai-assessment-creator-main
```

Create `.env.local` in the project root:
```
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

```bash
npm install
npm run build
npm run preview
```

---

## Deploying

### Frontend - Vercel

1. Push the frontend folder to a GitHub repo
2. Import it on vercel.com
3. Add these environment variables in the Vercel dashboard:
   ```
   VITE_API_URL=https://your-render-app.onrender.com
   VITE_WS_URL=wss://your-render-app.onrender.com
   ```
4. Deploy

### Backend - Render

Create three services on render.com:

**1. Web Service (API)**
- Build command: `npm install && npm run build`
- Start command: `node dist/server.js`

**2. Background Worker**
- Build command: `npm install && npm run build`
- Start command: `node dist/workers/assessment.worker.js`

**3. Redis**
- Create a Render managed Redis instance, copy the internal host and port

Set these environment variables on both the Web Service and Worker:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/veda-ai
REDIS_HOST=<internal host from Render Redis>
REDIS_PORT=6379
JWT_SECRET=your_long_random_secret
ANTHROPIC_API_KEY=sk-ant-your-key-here
CORS_ORIGIN=https://your-app.vercel.app
JWT_EXPIRES_IN=7d
```

### MongoDB - Atlas

1. Go to atlas.mongodb.com and create a free M0 cluster
2. Create a database user with a password
3. Whitelist all IPs (0.0.0.0/0) for Render compatibility
4. Copy the connection string and set it as `MONGODB_URI`

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/users/profile | Yes | Get profile |
| PATCH | /api/users/profile | Yes | Update name |
| PATCH | /api/users/change-password | Yes | Change password |
| POST | /api/assignments | Yes | Create and queue generation |
| GET | /api/assignments | Yes | List with pagination |
| GET | /api/assignments/:id | Yes | Get single with generated paper |
| GET | /api/assignments/:id/status | Yes | Poll job status |
| POST | /api/assignments/:id/regenerate | Yes | Regenerate paper |
| DELETE | /api/assignments/:id | Yes | Delete |

WebSocket connection: `ws://localhost:5000/ws?token=<jwt>`
