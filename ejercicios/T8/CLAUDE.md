# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

Requires Node.js >= 20.11.0. No test runner is configured.

## Environment

Create a `.env` file with:
```
MONGODB_URI=mongodb://localhost:27017/t8
JWT_SECRET=your_secret_here
PORT=3000
```

The `--env-file=.env` flag is used natively (no dotenv package needed).

## Architecture

T8 is an Express 5 REST API that builds on T7 by adding Swagger/OpenAPI documentation. The codebase uses ES modules (`"type": "module"`).

**Expected structure** (T8 extends T7's layout):
```
src/
  app.js                        - Express entry: DB connect, middleware, routes, swagger
  config/db.js                  - Mongoose connection
  docs/swagger.js               - Swagger spec (OpenAPI 3.0.3) — already present
  controllers/                  - Route handler logic
  middleware/
    session.middleware.js       - JWT verification → populates req.user
    rol.middleware.js           - RBAC: checkRol(['admin', 'user'])
    validate.middleware.js      - Zod schema validation
    error.middleware.js         - Global error handler
  models/
    user.model.js               - User (name, email, password[select:false], age, role)
    track.model.js              - Track (title, artist ref, duration, genres[])
    refreshToken.model.js       - RefreshToken (token, user ref, expiresAt, revokedAt)
  routes/
    index.js                    - Mounts sub-routers under /api/*
    auth.routes.js              - POST /register /login /refresh /logout /logout-all
    tracks.routes.js            - GET / GET /:id POST / DELETE /:id
  utils/
    handleJwt.js                - generateAccessToken (15m JWT), generateRefreshToken (opaque, 7 days)
    handlePassword.js           - bcryptjs encrypt/compare wrappers
    handleError.js              - handleHttpError(res, message, code)
  validators/                   - Zod schemas for request body validation
```

## Key patterns

**Auth flow**: Access token (15-min JWT) + Refresh token (opaque 128-char hex stored in MongoDB). `session.middleware.js` verifies the Bearer JWT and populates `req.user`. Role checking is done by `checkRol` middleware after `authMiddleware`.

**Swagger**: Config in `src/docs/swagger.js` — scans JSDoc comments in `./src/routes/*.js`. Schemas for `User`, `Track`, `Login`, and `Error` are defined there. Mount with `swagger-ui-express` at `/api-docs` in `app.js`. The `bearerAuth` security scheme is pre-configured for JWT routes.

**Validation**: Zod schemas are used with a `validate.middleware.js` wrapper before controllers.

**Error handling**: Use `handleHttpError(res, message, statusCode)` from `utils/handleError.js` for consistent error responses `{ error: true, message }`.
