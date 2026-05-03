# BildyApp API

API REST para gestión de albaranes (partes de horas o materiales) entre clientes y proveedores.

## Tecnologías

- **Runtime**: Node.js 22 (ESM, `--env-file`)
- **Framework**: Express 5
- **Base de datos**: MongoDB + Mongoose
- **Auth**: JWT (access + refresh tokens)
- **Validación**: Zod
- **Documentación**: Swagger/OpenAPI 3.0
- **Tests**: Jest + Supertest + mongodb-memory-server
- **WebSockets**: Socket.IO
- **Archivos**: Multer + Sharp + Cloudinary
- **PDF**: pdfkit
- **Email**: Nodemailer
- **Contenedores**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

## Instalación

```bash
npm install
```

## Configuración

Copia `.env.example` a `.env` y rellena los valores:

```bash
cp .env.example .env
```

Variables requeridas:
- `DB_URI` — URI de MongoDB
- `JWT_SECRET` — Clave secreta JWT (mín. 32 caracteres)
- `JWT_REFRESH_SECRET` — Clave para refresh tokens
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Credenciales Cloudinary
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — Configuración SMTP para emails
- `SLACK_WEBHOOK_URL` — Webhook de Slack para logging de errores 5XX

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Con Docker Compose
```bash
docker compose up
```

La API estará disponible en `http://localhost:3000`.

## Documentación Swagger

Accede a la UI interactiva en: `http://localhost:3000/api-docs`

## Tests

```bash
# Ejecutar todos los tests
npm test

# Modo watch
npm run test:watch

# Con cobertura
npm run test:coverage
```

## Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/user/register` | Registro |
| POST | `/api/user/login` | Login |
| PUT | `/api/user/validation` | Verificar email |
| POST | `/api/client` | Crear cliente |
| GET | `/api/client` | Listar clientes |
| POST | `/api/project` | Crear proyecto |
| GET | `/api/project` | Listar proyectos |
| POST | `/api/deliverynote` | Crear albarán |
| GET | `/api/deliverynote/pdf/:id` | Descargar PDF |
| PATCH | `/api/deliverynote/:id/sign` | Firmar albarán |
| GET | `/health` | Health check |

## WebSockets

Conectar con JWT:
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: '<JWT>' }
});

socket.on('client:new', (data) => console.log('Nuevo cliente:', data));
socket.on('project:new', (data) => console.log('Nuevo proyecto:', data));
socket.on('deliverynote:new', (data) => console.log('Nuevo albarán:', data));
socket.on('deliverynote:signed', (data) => console.log('Albarán firmado:', data));
```
