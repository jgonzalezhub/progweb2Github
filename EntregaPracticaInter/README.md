# BildyApp — API REST

API REST para la gestión de usuarios, empresas y autónomos. Desarrollada con Node.js, Express 5 y MongoDB (Mongoose).

## Tecnologías

- **Node.js** (ESModules)
- **Express 5**
- **MongoDB** + **Mongoose 8**
- **JWT** (access token + refresh token)
- **Zod** — validación de esquemas
- **Multer** — subida de archivos
- **bcryptjs** — hash de contraseñas
- **Helmet / CORS / Morgan / express-rate-limit** — seguridad y logging

## Estructura del proyecto

```
src/
├── config/
│   └── db.js                  # Conexión a MongoDB
├── controllers/
│   └── user.controller.js     # Lógica de negocio de usuarios
├── middleware/
│   ├── error.middleware.js    # Manejo global de errores
│   ├── rol.middleware.js      # Control de roles
│   ├── session.middleware.js  # Autenticación JWT
│   ├── upload.middleware.js   # Subida de imágenes (Multer)
│   └── validate.middleware.js # Validación Zod
├── models/
│   ├── company.model.js       # Modelo Empresa
│   ├── user.model.js          # Modelo Usuario
│   └── index.js               # Exportación de modelos
├── routes/
│   ├── index.js               # Router principal (carga automática)
│   └── user.routes.js         # Rutas de usuario
├── services/
│   └── notification.service.js # Eventos de notificación (EventEmitter)
├── utils/
│   ├── AppError.js            # Clase de error operacional
│   ├── handleError.js         # Helper respuesta HTTP error
│   ├── handleJwt.js           # Firma y verificación de tokens
│   └── handlePassword.js      # Hash y comparación de contraseñas
├── schemas/
│   └── user.schema.js         # Esquemas Zod de validación
├── app.js                     # Configuración Express
└── index.js                   # Arranque del servidor
storage/                       # Imágenes subidas (no versionadas)
```

## Instalación

```bash
npm install
```

Copia el fichero de variables de entorno y edítalo con tus valores:

```bash
cp .env.example .env
```

## Variables de entorno

| Variable               | Descripción                          | Ejemplo                          |
|------------------------|--------------------------------------|----------------------------------|
| `PORT`                 | Puerto del servidor                  | `3000`                           |
| `NODE_ENV`             | Entorno de ejecución                 | `development`                    |
| `DB_URI`               | URI de conexión a MongoDB Atlas      | `mongodb+srv://...`              |
| `JWT_SECRET`           | Clave secreta para access tokens     | cadena aleatoria larga           |
| `JWT_EXPIRES_IN`       | Expiración del access token          | `2h`                             |
| `JWT_REFRESH_SECRET`   | Clave secreta para refresh tokens    | cadena aleatoria larga           |
| `JWT_REFRESH_EXPIRES_IN` | Expiración del refresh token       | `7d`                             |

## Arranque

```bash
# Producción
npm start

# Desarrollo (nodemon)
npm run dev
```

## Endpoints de la API

Base URL: `http://localhost:3000/api`

### Públicos

| Método | Ruta                  | Descripción                        |
|--------|-----------------------|------------------------------------|
| GET    | `/health`             | Estado del servidor                |
| POST   | `/user/register`      | Registro con email y contraseña    |
| POST   | `/user/login`         | Login — devuelve tokens            |
| POST   | `/user/refresh`       | Renovar access token               |

### Autenticados (requieren `Authorization: Bearer <token>`)

| Método | Ruta                  | Descripción                                      |
|--------|-----------------------|--------------------------------------------------|
| GET    | `/user`               | Obtener perfil del usuario autenticado           |
| PUT    | `/user/register`      | Onboarding personal (nombre, apellidos, NIF)     |
| PUT    | `/user/validation`    | Validar código de verificación de email          |
| PATCH  | `/user/company`       | Onboarding empresa / unirse a empresa existente  |
| PATCH  | `/user/logo`          | Subir logo de empresa (`multipart/form-data`)    |
| POST   | `/user/logout`        | Cerrar sesión                                    |
| DELETE | `/user`               | Eliminar cuenta (`?soft=true` para soft delete)  |
| PUT    | `/user/password`      | Cambiar contraseña                               |

### Solo admins

| Método | Ruta              | Descripción                    |
|--------|-------------------|--------------------------------|
| POST   | `/user/invite`    | Invitar un compañero a la empresa |

## Flujo de uso

1. **Registro** → `POST /user/register` → se recibe `token` y `refreshToken`
2. **Verificación email** → `PUT /user/validation` con el código de 6 dígitos (visible en consola en desarrollo)
3. **Onboarding personal** → `PUT /user/register` con nombre, apellidos y NIF
4. **Onboarding empresa** → `PATCH /user/company`:
   - Empresa nueva: `{ "isFreelance": false, "cif": "B12345678", "name": "Mi Empresa SL" }`
   - Autónomo: `{ "isFreelance": true, "cif": "12345678A" }`
   - CIF existente: el usuario se une a la empresa como `guest`
5. **Logo** → `PATCH /user/logo` con `multipart/form-data` campo `logo` (imagen, máx. 5 MB)

## Seguridad

- Contraseñas hasheadas con **bcryptjs** (salt rounds: 10)
- Access token con expiración de 2 h, refresh token de 7 d
- Rate limiting: 100 peticiones / 15 min por IP
- Cabeceras de seguridad vía **Helmet**
- Campos sensibles (`password`, `emailVerificationCode`, `refreshToken`) excluidos de las respuestas
- Usuarios con soft delete no pueden autenticarse

## Archivos subidos

Los logos se almacenan en `storage/` y se sirven en `/uploads/<filename>`.  
La carpeta está excluida del repositorio (salvo `.gitkeep`); se crea automáticamente al arrancar.
