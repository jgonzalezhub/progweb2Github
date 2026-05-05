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

## Estructura del proyecto

src/
├── config/            Configuración de servicios externos y variables de entorno
│   ├── cloudinary.js  Inicializa el cliente de Cloudinary con las credenciales del entorno
│   ├── database.js    Conexión a MongoDB con manejo de errores y eventos de desconexión
│   ├── index.js       Exporta todas las variables de configuración leídas del entorno
│   ├── socket.js      Inicialización de Socket.IO con autenticación JWT por socket
│   └── swagger.js     Definición de la especificación OpenAPI 3.0 de la API
├── controllers/       Lógica de negocio de cada recurso de la API
│   ├── client.controller.js       Operaciones CRUD y archivado de clientes
│   ├── deliverynote.controller.js Creación, firma, descarga PDF y eliminación de albaranes
│   ├── project.controller.js      Operaciones CRUD y archivado de proyectos
│   └── user.controller.js         Registro, autenticación, onboarding e invitación de usuarios
├── middleware/        Middlewares de Express para autenticación, validación y errores
│   ├── auth.middleware.js     Verifica el token JWT y adjunta el usuario autenticado a la petición
│   ├── error.middleware.js    Manejadores globales de rutas no encontradas y errores 5XX
│   ├── rate-limit.js          Límites de peticiones globales y específicos para autenticación
│   ├── rol.middleware.js      Control de acceso basado en el rol del usuario autenticado
│   ├── sanitize.js            Sanitización del body para prevenir inyección NoSQL
│   ├── upload.js              Configuración de Multer para recibir imágenes en memoria
│   └── validate.middleware.js Validación de peticiones con esquemas Zod y verificación de ObjectId
├── models/            Esquemas y modelos de Mongoose para MongoDB
│   ├── Client.js       Modelo de cliente con índice único por empresa y CIF
│   ├── Company.js      Modelo de empresa con soporte para autónomos y logo
│   ├── DeliveryNote.js Modelo de albarán con soporte para formatos material y horas
│   ├── Project.js      Modelo de proyecto vinculado a empresa y cliente
│   └── User.js         Modelo de usuario con roles, verificación de email y soft delete
├── routes/            Definición de rutas Express con documentación Swagger inline
│   ├── client.routes.js       Rutas de CRUD y restauración de clientes
│   ├── deliverynote.routes.js Rutas de albaranes incluyendo firma y descarga de PDF
│   ├── index.js               Cargador dinámico que registra automáticamente todos los archivos de rutas
│   ├── project.routes.js      Rutas de CRUD y restauración de proyectos
│   └── user.routes.js         Rutas de autenticación, onboarding, invitación y gestión de cuenta
├── services/          Integraciones con servicios externos
│   ├── logger.service.js  Envío de notificaciones de errores 5XX a Slack
│   ├── mail.service.js    Envío de emails de verificación e invitación con Nodemailer
│   ├── pdf.service.js     Generación de PDFs de albaranes con pdfkit
│   └── storage.service.js Subida y eliminación de imágenes y PDFs en Cloudinary
├── utils/             Funciones auxiliares reutilizables en toda la aplicación
│   ├── AppError.js       Clase de error personalizada con código HTTP e indicador operacional
│   ├── handleError.js    Helper para enviar respuestas HTTP de error en formato JSON
│   ├── handleJwt.js      Generación y verificación de access tokens y refresh tokens JWT
│   └── handlePassword.js Hasheo y comparación de contraseñas con bcrypt
├── validators/        Esquemas Zod de validación para cada recurso de la API
│   ├── client.validator.js       Esquemas de creación y actualización de clientes
│   ├── deliverynote.validator.js Esquema de creación de albaranes con reglas por formato
│   ├── project.validator.js      Esquemas de creación y actualización de proyectos
│   └── user.validator.js         Esquemas de registro, login, onboarding e invitación
├── app.js    Configuración central de Express con middlewares, rutas y Swagger UI
└── index.js  Punto de entrada del servidor con arranque, shutdown y conexión a MongoDB

tests/
├── auth.test.js         Tests de registro, login, verificación de email y gestión de tokens
├── client.test.js       Tests de CRUD, archivado y restauración de clientes
├── deliverynote.test.js Tests de creación, firma y eliminación de albaranes
├── pdf.test.js          Tests de generación del PDF de un albarán
├── project.test.js      Tests de CRUD, archivado y restauración de proyectos
├── setup.js             Configuración global de Jest con MongoDB en memoria para los tests
└── utils.test.js        Tests de utilidades JWT, contraseñas y manejo de errores HTTP
