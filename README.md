# Study Buddy — Backend

## Setup (local)
1. Clone repo
2. `npm install`
3. Place Firebase service account JSON file somewhere safe and set `GOOGLE_APPLICATION_CREDENTIALS` in `.env`
4. `npm run dev`
5. API will be at `http://localhost:4000`

## Endpoints
- `POST /api/users` — create/update profile (auth required)
- `GET /api/users/:uid?` — fetch profile (auth required)
- `POST /api/sessions` — create session (auth)
- `GET /api/sessions` — list sessions (auth)
- `GET /api/sessions/:id` — get session (auth)
- `PATCH /api/sessions/:id/status` — update status (creator only)
- `GET /api/matches/for-session/:id` — find potential matches (auth)
- `POST /api/matches` — create match and chat (auth)
- `POST /api/chats/:chatId/messages` — send chat message (auth)
- `GET /api/chats/:chatId/messages` — get messages (auth)

## Notes
- Backend authenticates client tokens using Firebase Admin SDK. Client should sign in with Firebase Auth and pass ID token in Authorization header.