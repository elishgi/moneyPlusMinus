# moneyPlusMinus

## Overview
This repository now includes a minimal Express server that connects to MongoDB and stores keystroke logs from the client. Use the endpoints to capture typing activity (session, page, user, and individual key events) and to review the most recent logs for a given session.

## Getting started
1. Copy `.env.example` to `.env` and set `MONGODB_URI` to your database connection string.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the backend:
   ```bash
   npm run server
   ```
4. The API will be available at `http://localhost:4000` by default.

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
- `npm run dev` – start the Vite dev server for the React front end.
- `npm run server` – start the Express API after connecting to MongoDB.
- `npm run dev:server` – start the Express API with nodemon for live reloads.
