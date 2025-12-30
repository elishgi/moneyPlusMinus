# moneyPlusMinus

## Overview
This repository contains a MongoDB-backed Express API and a separate React client. Use the API to store keystroke logs from the client (session, page, user, and individual key events) and to review the most recent logs for a given session.

## Project structure
- `server/` – Express API (MongoDB connection, routes, controllers, and models).
- `client/` – React front end built with Vite.
- `.env.example` – Sample environment variables for the backend.

## Getting started
### Backend
1. Copy `.env.example` to `.env` and set `MONGODB_URI` to your database connection string.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the backend:
   ```bash
   npm run dev
   ```
4. The API will be available at `http://localhost:4000` by default.

### Frontend
1. Install dependencies:
   ```bash
   cd client
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
3. The React app will be available at `http://localhost:5173` by default.

## API
### Health check
`GET /api/health` → `{ status: "ok" }`

### Save keystrokes
`POST /api/keystrokes`
```json
{
  "sessionId": "session-123",
  "userId": "optional-user-id",
  "page": "/example",
  "metadata": { "locale": "he-IL" },
  "events": [
    {
      "key": "a",
      "inputValue": "a",
      "fieldName": "email",
      "eventType": "keydown",
      "typedAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```
- Returns `201` with the new log id when saved.
- Validation errors return `400`.

### Get latest keystrokes for a session
`GET /api/keystrokes/:sessionId`
- Returns the 20 most recent logs for the session, sorted by creation date.

## Development scripts
- `npm run dev` (root) – start the Express API with nodemon for live reloads.
- `npm run start` (root) – start the Express API after connecting to MongoDB.
- `npm run dev` (inside `client/`) – start the Vite dev server for the React front end.
- `npm run build` (inside `client/`) – build the production bundle for the React front end.
