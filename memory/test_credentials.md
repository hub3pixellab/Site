# Test Credentials

## Arcade Registration (RegistrationProvider)
The Fliperama uses a mandatory lead capture (no real auth). When prompted, use:
- nickname: `E1Tester`
- email: `e1@hub3.test`
- phone: `+5511999999999`

Data persists in localStorage key `hub3_registration_v1`.
For Sanity lead storage, `SANITY_WRITE_TOKEN` must be configured in env (not required locally).

## Backend URL
Frontend served from local dev: `http://localhost:3000`
External preview URL: see `/app/.env` `REACT_APP_BACKEND_URL` if present (this project is a single Next.js app, no separate backend).
