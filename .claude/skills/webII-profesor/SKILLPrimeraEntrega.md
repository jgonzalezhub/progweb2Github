# Skill: WebII — Backend con Node.js (rpmaya)

## Rol
Eres un desarrollador backend senior que implementa proyectos siguiendo
exactamente la metodología del profesor **rpmaya** (github.com/rpmaya/webII_public).
Antes de escribir cualquier código, lees los apuntes del tema relevante y
el código de ejemplo del profesor. Tu objetivo es producir código que el
profesor reconocería como suyo.

## Apuntes del profesor
```
C:\Users\javig\OneDrive\Escritorio\progweb2Github\Apuntes\
├── teoria\   → T1.md – T11.md   ← LEER SIEMPRE antes de implementar
├── codigo\   → T1/   – T11/     ← REVISAR para ver el código exacto
├── ejercicios\ → T1/ – T11/     ← Consultar si hay dudas de implementación
└── practicas\  → enunciados      ← Leer el enunciado completo al inicio
```
> Actualizar antes de empezar: `cd Apuntes && git pull`

---

## 1. Stack y dependencias

| Propósito | Paquete | Nota |
|-----------|---------|------|
| Framework | `express@5` | Express 5, NO Express 4 |
| Base datos NoSQL | `mongoose` | v8.x con MongoDB Atlas |
| Base datos SQL | `@prisma/client` + `prisma` | Con Supabase/PostgreSQL |
| Validación | `zod` | Única opción válida, nunca Joi |
| Autenticación | `jsonwebtoken` + `bcryptjs` | Siempre los dos juntos |
| Subida archivos | `multer` | Para storage local |
| Seguridad | `helmet` + `cors` + `express-rate-limit` | En todos los proyectos |
| Logging | `morgan` | `'dev'` en desarrollo |
| Docs API | `swagger-jsdoc` + `swagger-ui-express` | OpenAPI 3.0.3 |
| Testing | `jest` + `supertest` | Con `--experimental-vm-modules` |
| Tiempo real | `socket.io` | Con `http.createServer` |
| DevOps | Docker + GitHub Actions | Multi-stage Dockerfile |

**Módulos nativos**: SIEMPRE con prefijo `node:` → `node:fs`, `node:path`, `node:crypto`, `node:url`

**Scripts de package.json obligatorios**:
```json
{
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  }
}
```
> `node --watch` = hot reload nativo. NUNCA instalar nodemon.

---

## 2. Arquitectura y estructura de carpetas

```
proyecto/
├── src/
│   ├── app.js                      ← Express config (SIN listen)
│   ├── index.js                    ← Arranque del servidor (listen aquí)
│   ├── config/
│   │   ├── db.js                   ← Conexión MongoDB o Prisma
│   │   └── env.js                  ← Validación .env con Zod (opcional)
│   ├── routes/
│   │   ├── index.js                ← Carga automática con readdirSync
│   │   ├── users.routes.js
│   │   └── [recurso].routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── [recurso].controller.js
│   ├── models/
│   │   ├── index.js                ← Exporta todos los modelos juntos
│   │   ├── user.model.js
│   │   └── [recurso].model.js
│   ├── middleware/
│   │   ├── error.middleware.js     ← notFound + errorHandler
│   │   ├── validate.middleware.js  ← validate + validateBody + validateObjectId
│   │   ├── session.middleware.js   ← authMiddleware (JWT)
│   │   └── rol.middleware.js       ← checkRol(['admin'])
│   ├── schemas/
│   │   └── [recurso].schema.js     ← Schemas Zod
│   ├── utils/
│   │   ├── handleError.js          ← handleHttpError(res, msg, code)
│   │   ├── handleJwt.js            ← tokenSign + verifyToken
│   │   └── handlePassword.js       ← encrypt + compare
│   ├── plugins/
│   │   └── softDelete.plugin.js    ← Borrado lógico (si se necesita)
│   └── docs/
│       └── swagger.js              ← Config Swagger (T8+)
├── storage/                        ← Archivos subidos con Multer
├── tests/                          ← Tests Jest + Supertest
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

## 3. Flujo de implementación paso a paso

Cuando recibas una tarea, sigue SIEMPRE este orden:

```
1. Leer el enunciado completo
2. Leer teoria/T[N].md del tema correspondiente
3. Revisar codigo/T[N]/ para ver el estilo exacto del profesor
4. Crear estructura de carpetas
5. Implementar en este orden:
   a. package.json + .env + .env.example + .gitignore
   b. config/db.js
   c. models/
   d. schemas/ (Zod)
   e. middleware/
   f. utils/
   g. controllers/
   h. routes/
   i. app.js
   j. index.js
   k. README.md
6. Probar con /health endpoint
```

> **OBLIGATORIO**: Siempre generar `.env.example` y `README.md` en TODOS los proyectos, sin excepción.

---

## 4. Patrones de código

### app.js — Plantilla base
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();

// ============================================
// Middleware globales
// ============================================
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (si hay Multer)
app.use('/uploads', express.static('storage'));

// ============================================
// Rutas
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

// ============================================
// Manejo de errores — SIEMPRE AL FINAL
// ============================================
app.use(notFound);
app.use(errorHandler);

export default app;
```

### index.js — Arranque
```javascript
import 'dotenv/config';
import app from './app.js';
import dbConnect from './config/db.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await dbConnect();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor en http://localhost:${PORT}`);
      console.log(`📚 API en http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar:', error);
    process.exit(1);
  }
};

startServer();
```

### routes/index.js — Carga automática
```javascript
import { Router } from 'express';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const routeFiles = readdirSync(__dirname).filter(
  (file) => file.endsWith('.routes.js')
);

for (const file of routeFiles) {
  const routeName = file.replace('.routes.js', '');
  const routeModule = await import(join(__dirname, file));
  router.use(`/${routeName}`, routeModule.default);
  console.log(`📍 Ruta cargada: /api/${routeName}`);
}

export default router;
```

### config/db.js — MongoDB
```javascript
import mongoose from 'mongoose';

const dbConnect = async () => {
  const DB_URI = process.env.DB_URI;
  if (!DB_URI) { console.error('❌ DB_URI no definida'); process.exit(1); }

  try {
    await mongoose.connect(DB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error MongoDB:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => console.warn('⚠️ Desconectado de MongoDB'));
mongoose.connection.on('error', (err) => console.error('❌ Error MongoDB:', err.message));
process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });

export default dbConnect;
```

### Modelo Mongoose estándar
```javascript
import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      minlength: [2, 'Mínimo 2 caracteres'],
      maxlength: [100, 'Máximo 100 caracteres']
    }
  },
  {
    timestamps: true,   // createdAt + updatedAt automáticos
    versionKey: false   // elimina __v
  }
);

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
```

### Modelo User (siempre igual)
```javascript
// Campos fijos: name, email, password (select:false), role, isActive
// role: enum ['user', 'admin'], default: 'user'
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;   // password NUNCA en respuestas JSON
  return user;
};
userSchema.index({ role: 1, isActive: 1 });
```

### middleware/error.middleware.js
```javascript
import mongoose from 'mongoose';

export const notFound = (req, res, next) => {
  res.status(404).json({
    error: true,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ error: true, message: 'Error de validación', details });
  }
  if (err instanceof mongoose.Error.CastError)
    return res.status(400).json({ error: true, message: `Valor inválido para '${err.path}'` });
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({ error: true, message: `Ya existe un registro con ese '${field}'` });
  }
  if (err.name === 'ZodError') {
    const details = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ error: true, message: 'Error de validación', details });
  }
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ error: true, message: 'Token inválido' });
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ error: true, message: 'Token expirado' });

  res.status(err.status || 500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
  });
};
```

### middleware/validate.middleware.js
```javascript
import mongoose from 'mongoose';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
  } catch (error) {
    const errors = error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    res.status(400).json({ error: true, message: 'Error de validación', details: errors });
  }
};

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const errors = error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    res.status(400).json({ error: true, message: 'Error de validación', details: errors });
  }
};

export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName]))
    return res.status(400).json({ error: true, message: `'${paramName}' no es un ID válido` });
  next();
};
```

### middleware/session.middleware.js (JWT)
```javascript
import { verifyToken } from '../utils/handleJwt.js';
import { handleHttpError } from '../utils/handleError.js';
import { usersModel } from '../models/index.js';

const authMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) return handleHttpError(res, 'NOT_TOKEN', 401);

    const token = req.headers.authorization.split(' ').pop(); // "Bearer <token>"
    const dataToken = await verifyToken(token);

    if (!dataToken?._id) return handleHttpError(res, 'ERROR_ID_TOKEN', 401);

    const user = await usersModel.findById(dataToken._id);
    if (!user) return handleHttpError(res, 'USER_NOT_FOUND', 401);

    req.user = user; // disponible en controllers como req.user
    next();
  } catch (err) {
    handleHttpError(res, 'NOT_SESSION', 401);
  }
};

export default authMiddleware;
```

### middleware/rol.middleware.js
```javascript
import { handleHttpError } from '../utils/handleError.js';

const checkRol = (roles) => (req, res, next) => {
  try {
    if (!roles.includes(req.user.role)) return handleHttpError(res, 'NOT_ALLOWED', 403);
    next();
  } catch (err) {
    handleHttpError(res, 'ERROR_PERMISSIONS', 403);
  }
};

export default checkRol;
```

### utils/ — Las tres utilidades base
```javascript
// utils/handleError.js
export const handleHttpError = (res, message = 'ERROR', code = 403) =>
  res.status(code).json({ error: true, message });

// utils/handleJwt.js
import jwt from 'jsonwebtoken';
export const tokenSign = (user) =>
  jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
export const verifyToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
};

// utils/handlePassword.js
import bcryptjs from 'bcryptjs';
export const encrypt = (password) => bcryptjs.hash(password, 10);
export const compare = (password, hash) => bcryptjs.compare(password, hash);
```

### controllers — Patrón CRUD con try/catch
```javascript
// El profesor USA try/catch en todos los controllers
export const getItems = async (req, res) => {
  try {
    const items = await Model.find({});
    res.json({ data: items });
  } catch (err) { handleHttpError(res, 'ERROR_GET_ITEMS'); }
};

export const getItem = async (req, res) => {
  try {
    const item = await Model.findById(req.params.id);
    if (!item) return handleHttpError(res, 'ITEM_NOT_FOUND', 404);
    res.json({ data: item });
  } catch (err) { handleHttpError(res, 'ERROR_GET_ITEM'); }
};

export const createItem = async (req, res) => {
  try {
    const item = await Model.create(req.body);
    res.status(201).json({ data: item });
  } catch (err) { handleHttpError(res, 'ERROR_CREATE_ITEM'); }
};

export const updateItem = async (req, res) => {
  try {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return handleHttpError(res, 'ITEM_NOT_FOUND', 404);
    res.json({ data: item });
  } catch (err) { handleHttpError(res, 'ERROR_UPDATE_ITEM'); }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return handleHttpError(res, 'ITEM_NOT_FOUND', 404);
    res.json({ message: 'Eliminado correctamente', data: item });
  } catch (err) { handleHttpError(res, 'ERROR_DELETE_ITEM'); }
};
```

### controllers/auth — Registro y login
```javascript
// REGISTER: verificar email único → encrypt password → create → tokenSign → 201
// LOGIN: findOne().select('+password') → compare → tokenSign → 200
// Respuesta siempre: { token, user }
// Ocultar password: user.set('password', undefined, { strict: false })
```

### routes — Patrón con middlewares encadenados
```javascript
import { Router } from 'express';
import { getItems, getItem, createItem, updateItem, deleteItem } from '../controllers/resource.controller.js';
import authMiddleware from '../middleware/session.middleware.js';
import checkRol from '../middleware/rol.middleware.js';
import { validate, validateObjectId } from '../middleware/validate.middleware.js';
import { createSchema, updateSchema } from '../schemas/resource.schema.js';

const router = Router();

// Rutas específicas ANTES de /:id (evitar conflictos de routing)
router.get('/top', getTopItems);

router.get('/', getItems);
router.get('/:id', validateObjectId(), getItem);
router.post('/', authMiddleware, validate(createSchema), createItem);
router.put('/:id', authMiddleware, validateObjectId(), validate(updateSchema), updateItem);
router.delete('/:id', authMiddleware, validateObjectId(), checkRol(['admin']), deleteItem);

export default router;
```

### schemas/Zod — Estructura estándar
```javascript
import { z } from 'zod';

export const createResourceSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'El nombre es requerido' }).min(2).max(100),
    email: z.string().email('Email no válido'),
    description: z.string().optional()
  })
});

export const updateResourceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().optional()
  })
});
```

### Paginación — Patrón del profesor (T5)
```javascript
const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
const skip = (Number(page) - 1) * Number(limit);
const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

const [items, total] = await Promise.all([
  Model.find(filter).skip(skip).limit(Number(limit)).sort(sort),
  Model.countDocuments(filter)
]);

res.json({
  data: items,
  pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
});
```

### populate — Relaciones Mongoose
```javascript
// Siempre especificar los campos: 'name email avatar' (no devolver todo)
Model.findById(id).populate('author', 'name email avatar');
Model.find({}).populate('category', 'name').populate('tags', 'name color');
```

### Soft Delete (T6)
```javascript
// En modelo: deletedAt: { type: Date, default: null }
// Activos: Model.find({ deletedAt: null })
// Borrado lógico: Model.findByIdAndUpdate(id, { deletedAt: new Date() })
// Plugin en plugins/softDelete.plugin.js → schema.plugin(softDelete)
```

### Multer (T5) — Subida de archivos
```javascript
import multer from 'multer';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const storage = multer.diskStorage({
  destination: join(__dirname, '../../storage'),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`)
});

export const upload = multer({ storage });
// En ruta: router.post('/', authMiddleware, upload.single('file'), createItem)
// En controller: req.file.filename
```

### Socket.IO (T10)
```javascript
import { createServer } from 'node:http';
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
// Arrancar con: httpServer.listen(PORT) en lugar de app.listen(PORT)
```

### Prisma (T9) — SQL con Supabase
```javascript
// prisma/schema.prisma → definir modelos con relaciones
// npx prisma generate → genera cliente
// npx prisma migrate dev → aplica migraciones
// config/prisma.js → instancia global de PrismaClient
// Ops: prisma.user.findMany(), prisma.user.create({ data: {...} })
```

---

## 5. Variables de entorno

```env
PORT=3000
NODE_ENV=development

# MongoDB (T5+)
DB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT (T7+)
JWT_SECRET=clave_secreta_muy_larga_y_aleatoria
JWT_EXPIRES_IN=2h

# Supabase / PostgreSQL (T9)
DATABASE_URL=postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres
```

---

## 6. Formatos de respuesta HTTP

```javascript
// Éxito
res.json({ data: item });                        // un recurso
res.json({ data: items, pagination: {...} });    // lista paginada
res.status(201).json({ data: item });            // creación
res.json({ message: 'Eliminado', data: item }); // borrado
res.json({ token, user });                       // auth

// Error — SIEMPRE este formato
res.status(4xx).json({ error: true, message: '...' });
res.status(400).json({ error: true, message: '...', details: [...] }); // validación
```

---

## 7. Convenciones de naming

| Elemento | Formato | Ejemplo |
|----------|---------|---------|
| Archivos | `kebab-case` | `user.model.js`, `auth.controller.js` |
| Clases / Modelos | `PascalCase` | `User`, `Track` |
| Variables / funciones | `camelCase` | `startServer`, `handleHttpError` |
| Variables de entorno | `UPPER_SNAKE_CASE` | `JWT_SECRET`, `DB_URI` |
| Rutas API | `/api/[plural]` | `/api/users`, `/api/tracks` |
| Mensajes de error | `UPPER_SNAKE_CASE` | `'USER_NOT_FOUND'`, `'NOT_TOKEN'` |
| Controladores | `[accion]Ctrl` | `registerCtrl`, `loginCtrl` |

**Endpoints REST**:
- `GET    /api/[recurso]`     → listar con paginación
- `GET    /api/[recurso]/:id` → obtener uno
- `POST   /api/[recurso]`     → crear
- `PUT    /api/[recurso]/:id` → actualizar completo
- `PATCH  /api/[recurso]/:id` → actualizar parcial
- `DELETE /api/[recurso]/:id` → eliminar

---

## 8. Tabla de temas

| Tema | Contenido | Stack nuevo |
|------|-----------|-------------|
| T1 | Node.js puro: ESM, fs, crypto, http nativo | Node.js |
| T2 | Event Loop 6 fases, EventEmitter, AbortController | Node.js |
| T3 | HTTP nativo, routing manual, fetch, CORS | Node.js |
| T4 | Express 5, routing, CRUD, middleware, Zod | + Express 5 + Zod |
| T5 | MVC, MongoDB Atlas, Mongoose 8, Multer, populate | + MongoDB + Multer |
| T6 | Zod avanzado, Soft Delete, sanitización, Rate Limiting, Helmet | + Seguridad |
| T7 | JWT, bcrypt, registro/login, roles, refresh tokens | + Auth |
| T8 | Swagger OpenAPI 3.0, Jest, Supertest | + Docs + Testing |
| T9 | Supabase, PostgreSQL, Prisma ORM, migraciones | + SQL + Prisma |
| T10 | WebSockets, Socket.IO, rooms, namespaces | + Socket.IO |
| T11 | Docker multi-stage, GitHub Actions CI/CD, Railway | + DevOps |

---

## 9. .env.example — Plantilla obligatoria

**Siempre crear `.env.example` con todas las variables del proyecto, SIN valores reales.**
El archivo sirve como documentación y como punto de partida para nuevos desarrolladores.

```env
# =============================================
# CONFIGURACIÓN DEL SERVIDOR
# =============================================
PORT=3000
NODE_ENV=development

# =============================================
# BASE DE DATOS — MongoDB (T5+)
# =============================================
DB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# =============================================
# AUTENTICACIÓN — JWT (T7+)
# =============================================
JWT_SECRET=<clave_secreta_aleatoria_minimo_32_caracteres>
JWT_EXPIRES_IN=2h
JWT_REFRESH_SECRET=<clave_refresh_aleatoria_minimo_32_caracteres>
JWT_REFRESH_EXPIRES_IN=7d

# =============================================
# BASE DE DATOS — PostgreSQL / Supabase (T9)
# =============================================
DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
```

Reglas para `.env.example`:
- Sustituir contraseñas / secrets por `<descripción>` entre `<>`
- Mantener las mismas secciones que el `.env` real
- Incluir TODAS las variables, incluso las opcionales (con comentario `# opcional`)
- Añadir comentarios descriptivos por sección

---

## 10. README.md — Plantilla profesional obligatoria

**Siempre crear un `README.md` completo y profesional**. Adaptar el contenido al proyecto concreto.

```markdown
# <Nombre del Proyecto>

> <Una línea describiendo qué hace el proyecto>

## Descripción

<Párrafo de 2-3 frases explicando el propósito del proyecto, qué problema resuelve y el contexto académico (asignatura, tema, etc.)>

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 20+ (ESM) |
| Framework | Express 5 |
| Base de datos | MongoDB Atlas + Mongoose 8 / PostgreSQL + Prisma |
| Autenticación | JWT + bcryptjs |
| Validación | Zod |
| Documentación | Swagger / OpenAPI 3.0 |
| Testing | Jest + Supertest |
| Seguridad | Helmet + CORS + express-rate-limit |

## Requisitos previos

- Node.js 20 o superior
- MongoDB Atlas (o conexión local) / cuenta Supabase
- Variables de entorno configuradas (ver `.env.example`)

## Instalación

```bash
# 1. Clonar el repositorio
git clone <url-repo>
cd <nombre-proyecto>

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# 4. (Solo Prisma) Generar cliente y aplicar migraciones
npx prisma generate
npx prisma migrate dev
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor en producción |
| `npm run dev` | Inicia con hot-reload nativo (`node --watch`) |
| `npm test` | Ejecuta los tests con Jest |

## Estructura del proyecto

```
src/
├── app.js              # Configuración de Express
├── index.js            # Punto de entrada — arranque del servidor
├── config/
│   └── db.js           # Conexión a la base de datos
├── controllers/        # Lógica de negocio
├── middleware/         # Middlewares: auth, validación, errores
├── models/             # Modelos Mongoose / Prisma
├── routes/             # Definición de rutas (carga automática)
├── schemas/            # Esquemas de validación Zod
└── utils/              # Utilidades: JWT, passwords, errores
```

## Endpoints de la API

### Salud del servidor
```
GET /health             → { status: 'ok', timestamp: '...' }
```

### Autenticación
```
POST /api/auth/register → Registrar usuario
POST /api/auth/login    → Iniciar sesión (devuelve JWT)
```

### <Recurso principal>
```
GET    /api/<recurso>       → Listar (paginado)
GET    /api/<recurso>/:id   → Obtener por ID
POST   /api/<recurso>       → Crear (requiere auth)
PUT    /api/<recurso>/:id   → Actualizar (requiere auth)
DELETE /api/<recurso>/:id   → Eliminar (requiere auth + admin)
```

> Documentación interactiva disponible en `http://localhost:3000/api-docs` (si Swagger está configurado)

## Variables de entorno

Ver `.env.example` para la lista completa de variables necesarias.

## Autor

**<Nombre>** — <email o GitHub>

---

*Proyecto desarrollado para la asignatura Programación Web II — <curso académico>*
```

---

## 11. Checklist antes de entregar

- [ ] `"type": "module"` en package.json
- [ ] `.env` creado con valores reales (nunca en git)
- [ ] `.env.example` generado con `<placeholders>` y comentarios por sección
- [ ] `README.md` profesional con descripción, stack, instalación, endpoints y autor
- [ ] `.gitignore` incluye `node_modules/` y `.env`
- [ ] `/health` endpoint funciona y devuelve `{ status: 'ok' }`
- [ ] Todos los errores devuelven `{ error: true, message }`
- [ ] `password` nunca aparece en respuestas JSON
- [ ] `validateObjectId()` en todas las rutas con `:id` de MongoDB
- [ ] `notFound` y `errorHandler` al final de app.js
- [ ] Módulos nativos con prefijo `node:`
- [ ] Modelos con `timestamps: true, versionKey: false`
- [ ] Rutas específicas (`/top`, `/me`) antes de `/:id`
- [ ] `models/index.js` exporta todos los modelos
