# T10 — Chat en Tiempo Real con Socket.IO

> API REST + WebSockets para un sistema de chat con salas, autenticación JWT y persistencia en MongoDB.

## Descripción

Aplicación de chat en tiempo real desarrollada con Node.js, Express 5 y Socket.IO. Permite a los usuarios registrarse, iniciar sesión y unirse a salas de chat donde pueden enviar mensajes que se distribuyen en tiempo real a todos los participantes. Los mensajes se persisten en MongoDB Atlas. Proyecto correspondiente al Tema 10 de la asignatura Programación Web II.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 20+ (ESM nativo) |
| Framework HTTP | Express 5 |
| WebSockets | Socket.IO 4 |
| Base de datos | MongoDB Atlas + Mongoose 8 |
| Autenticación | JWT (jsonwebtoken) + bcryptjs |
| Validación | Zod |
| Seguridad | Helmet + CORS |
| Logging | Morgan |

## Requisitos previos

- Node.js 20 o superior
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) con un cluster activo
- Variables de entorno configuradas (ver `.env.example`)

## Instalación

```bash
# 1. Clonar el repositorio
git clone <url-repo>
cd T10

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor en producción |
| `npm run dev` | Inicia con hot-reload nativo (`node --watch`) |

## Estructura del proyecto

```
src/
├── app.js                      # Express + Socket.IO + middlewares globales
├── index.js                    # Arranque del servidor (httpServer.listen)
├── config/
│   └── db.js                   # Conexión a MongoDB Atlas
├── controllers/
│   ├── auth.controller.js      # Registro, login, perfil
│   └── rooms.controller.js     # CRUD salas + historial de mensajes
├── middleware/
│   ├── session.middleware.js   # authMiddleware (JWT HTTP) + socketAuthMiddleware
│   ├── validate.middleware.js  # validate / validateBody / validateObjectId
│   └── error.middleware.js     # notFound + errorHandler
├── models/
│   ├── index.js                # Exporta todos los modelos
│   ├── user.model.js           # Usuario (name, email, password, role)
│   ├── room.model.js           # Sala de chat (name, description, creator)
│   └── message.model.js        # Mensaje (room, sender, content)
├── routes/
│   ├── index.js                # Carga automática con readdirSync
│   ├── auth.routes.js          # /api/auth
│   └── rooms.routes.js         # /api/rooms
├── schemas/
│   ├── auth.schema.js          # Zod: register + login
│   └── room.schema.js          # Zod: createRoom
├── socket/
│   ├── index.js                # Configuración Socket.IO + auth middleware
│   └── handlers/
│       ├── chat.handler.js     # Eventos: chat:message, chat:typing
│       └── room.handler.js     # Eventos: room:join, room:leave
└── utils/
    ├── handleError.js          # handleHttpError(res, msg, code)
    ├── handleJwt.js            # tokenSign + verifyToken
    └── handlePassword.js       # encrypt + compare

public/
├── index.html                  # Página de login / registro
└── chat.html                   # Interfaz del chat
```

## Endpoints de la API

### Servidor
```
GET /health                     → { status: 'ok', timestamp: '...' }
```

### Autenticación
```
POST /api/auth/register         → Registrar usuario  (público)
POST /api/auth/login            → Iniciar sesión      (público) → { token, user }
GET  /api/auth/me               → Perfil propio       (requiere JWT)
```

### Salas
```
GET  /api/rooms                 → Listar todas las salas          (público)
POST /api/rooms                 → Crear sala                      (requiere JWT)
GET  /api/rooms/:id/messages    → Historial paginado de mensajes  (público)
```

## Eventos Socket.IO

La conexión requiere autenticación JWT en el handshake:
```js
const socket = io({ auth: { token: '<jwt>' } });
```

| Evento (emit) | Datos | Descripción |
|---------------|-------|-------------|
| `room:join` | `{ roomId }` | Unirse a una sala |
| `room:leave` | `{ roomId }` | Salir de una sala |
| `chat:message` | `{ roomId, content }` | Enviar mensaje |
| `chat:typing` | `{ roomId }` | Indicador de escritura |

| Evento (on) | Datos | Descripción |
|-------------|-------|-------------|
| `chat:message` | `{ _id, user, content, timestamp }` | Nuevo mensaje en la sala |
| `chat:typing` | `{ user }` | Alguien está escribiendo |
| `room:user-joined` | `{ user }` | Usuario entró a la sala |
| `room:user-left` | `{ user }` | Usuario salió de la sala |
| `user:online` | `{ userId, name }` | Usuario conectado |
| `user:offline` | `{ userId, name }` | Usuario desconectado |

## Variables de entorno

Ver `.env.example` para la lista completa. Variables necesarias:

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (defecto: 3000) |
| `NODE_ENV` | Entorno (`development` / `production`) |
| `MONGODB_URI` | Cadena de conexión a MongoDB Atlas |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |
| `JWT_EXPIRES_IN` | Duración del token (defecto: `2h`) |

## Autor

**Javi González** — jgonzalezhub

---

*Proyecto desarrollado para la asignatura Programación Web II — curso 2025/2026*
