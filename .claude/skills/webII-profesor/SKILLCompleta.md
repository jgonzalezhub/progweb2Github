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
├── teoria\   → T1.md – T13.md   ← LEER SIEMPRE antes de implementar
├── codigo\   → T1/   – T13/     ← REVISAR para ver el código exacto
├── ejercicios\ → T1/ – T13/     ← Consultar si hay dudas de implementación
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
| TypeScript | `typescript` + `tsx` | Target ES2022, module NodeNext |
| Storage cloud | `cloudinary` | Subida con buffer desde Multer |
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
   a. package.json + .env + .gitignore
   b. config/db.js
   c. models/
   d. schemas/ (Zod)
   e. middleware/
   f. utils/
   g. controllers/
   h. routes/
   i. app.js
   j. index.js
6. Probar con /health endpoint
```

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

# Cloudinary (T13)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
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
| T8 | Swagger OpenAPI 3.0, Jest, Supertest, monitorización Slack | + Docs + Testing |
| T9 | Supabase, PostgreSQL, Prisma ORM, migraciones, relaciones SQL | + SQL + Prisma |
| T10 | WebSockets, Socket.IO, rooms, namespaces, auth en sockets | + Socket.IO |
| T11 | Docker multi-stage, GitHub Actions CI/CD, Railway, PM2 | + DevOps |
| T12 | TypeScript: tipos, interfaces, genéricos, Express+Mongoose tipados | + TypeScript |
| T13 | Multer avanzado, Cloudinary, Cloudflare R2, validación de archivos | + Storage cloud |

---

## 9. Patrones T8 — Swagger y Testing

### Swagger — Configuración en app.js
```javascript
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';

// Añadir ANTES de las rutas de api
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### Swagger — docs/swagger.js
```javascript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: { title: 'API', version: '1.0.0', description: 'API REST documentada' },
    servers: [{ url: 'http://localhost:3000', description: 'Desarrollo' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./src/routes/*.js'] // Lee los JSDoc de las rutas
};

export default swaggerJsdoc(options);
```

### Jest — package.json para ESM
```json
{
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/.bin/jest"
  },
  "jest": {
    "transform": {},
    "testEnvironment": "node"
  }
}
```

### Test con Supertest — Patrón base
```javascript
import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/tracks', () => {
  it('debe devolver lista de tracks', async () => {
    const res = await request(app).get('/api/tracks');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  it('debe devolver token con credenciales válidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: '123456' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
```

---

## 10. Patrones T12 — TypeScript

### tsconfig.json — Configuración del profesor
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Scripts TypeScript en package.json
```json
{
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  }
}
```

### app.ts — Express tipado
```typescript
import express, { Express, Request, Response, NextFunction } from 'express';

const app: Express = express();

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Error handler tipado
interface AppError extends Error {
  statusCode?: number;
}

app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.statusCode || 500).json({
    error: true,
    message: err.message || 'Error interno'
  });
});

export default app;
```

### Types — src/types/index.ts
```typescript
export enum UserRole { USER = 'USER', ADMIN = 'ADMIN' }
export enum UserStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE' }

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs para crear/actualizar
export type CreateUserDTO = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserDTO = Partial<CreateUserDTO>;
```

### Controllers tipados — Patrón del profesor
```typescript
import { Request, Response, NextFunction } from 'express';
import { CreateUserDTO, UpdateUserDTO } from '../types/index.js';

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // lógica...
    res.json({ data: [] });
  } catch (error) {
    next(error); // en TypeScript delega al errorHandler
  }
};

export const createUser = async (
  req: Request<object, object, CreateUserDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, name } = req.body;
    // lógica...
    res.status(201).json({ data: {} });
  } catch (error) {
    next(error);
  }
};
```

### Mongoose tipado (T12 + T5)
```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: true, versionKey: false }
);

export const UserModel = mongoose.model<IUser>('User', userSchema);
```

---

## 11. Patrones T13 — Storage de archivos

### config/multer.js — Tres modos
```javascript
import multer from 'multer';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// MODO 1: Disco local
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${unique}${extname(file.originalname)}`);
  }
});

// MODO 2: Memoria (para enviar a Cloudinary)
const memoryStorage = multer.memoryStorage();

// Filtros por tipo
const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Solo imágenes (JPEG, PNG, GIF, WebP)'), false);
};

// Exportaciones
export const uploadImageLocal = multer({ storage: localStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadImageMemory = multer({ storage: memoryStorage, fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });
export const uploadDocument = multer({ storage: localStorage, limits: { fileSize: 20 * 1024 * 1024 } });
```

### config/cloudinary.js
```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Subir desde buffer (flujo Multer memory → Cloudinary)
export const uploadFromBuffer = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: options.folder || 'uploads', resource_type: 'auto', ...options },
      (error, result) => error ? reject(error) : resolve(result)
    ).end(buffer);
  });
};

export const deleteImage = (publicId) => cloudinary.uploader.destroy(publicId);

export const getOptimizedUrl = (publicId, options = {}) =>
  cloudinary.url(publicId, { fetch_format: 'auto', quality: 'auto', ...options });

export default cloudinary;
```

### Flujo Multer → Cloudinary en controller
```javascript
import { uploadFromBuffer } from '../config/cloudinary.js';

export const createItemWithImage = async (req, res) => {
  try {
    let imageUrl = null;

    if (req.file) {
      // req.file.buffer existe porque usamos memoryStorage
      const result = await uploadFromBuffer(req.file.buffer, { folder: 'items' });
      imageUrl = result.secure_url; // URL pública de Cloudinary
    }

    const item = await Model.create({ ...req.body, image: imageUrl });
    res.status(201).json({ data: item });
  } catch (err) {
    handleHttpError(res, 'ERROR_CREATE_ITEM');
  }
};
```

### Ruta con Multer + Cloudinary
```javascript
import { uploadImageMemory } from '../config/multer.js';

// upload.single('image') = nombre del campo en el form
router.post('/', authMiddleware, uploadImageMemory.single('image'), validate(createSchema), createItemWithImage);
router.put('/:id', authMiddleware, validateObjectId(), uploadImageMemory.single('image'), updateItem);
```

### Variables de entorno T13
```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

---

## 12. Correcciones y matices del profesor

Estos son errores frecuentes que el profesor corrige en las entregas.
Aplicarlos siempre por defecto sin que se pidan explícitamente.

### Variables de entorno — Usar --env-file, NO dotenv
```javascript
// ❌ MAL — el profesor ya NO usa dotenv en Node 22+
import 'dotenv/config';

// ✅ BIEN — arrancar con el flag nativo de Node 22
// package.json:
{
  "scripts": {
    "dev": "node --watch --env-file=.env src/index.js",
    "start": "node --env-file=.env src/index.js"
  }
}
// No instalar ni importar dotenv en ningún archivo
```

### Códigos HTTP — Usar el código correcto según el caso
```javascript
// ❌ MAL — 403 para límite de intentos agotado
handleHttpError(res, 'EMAIL_ATTEMPTS_EXCEEDED', 403);

// ✅ BIEN — 429 Too Many Requests para rate limit / intentos agotados
handleHttpError(res, 'EMAIL_ATTEMPTS_EXCEEDED', 429);

// Regla: 403 = prohibido por permisos, 429 = demasiadas peticiones/intentos
```

### Modelos — select:false en campos sensibles
```javascript
// ❌ MAL — campo sensible visible en queries por defecto
emailVerificationCode: { type: String }
emailVerificationAttempts: { type: Number, default: 0 }

// ✅ BIEN — select:false en TODOS los campos sensibles, no solo password
password: { type: String, select: false },
emailVerificationCode: { type: String, select: false },
emailVerificationAttempts: { type: Number, default: 0, select: false },
emailVerificationExpires: { type: Date, select: false }

// Cuando se necesiten en un query concreto, recuperarlos explícitamente:
const user = await User.findById(id).select('+emailVerificationCode +emailVerificationAttempts');
```

### Login — Validar status del usuario
```javascript
// ❌ MAL — login sin comprobar si el usuario está verificado/activo
const user = await User.findOne({ email }).select('+password');
if (!user) return handleHttpError(res, 'USER_NOT_EXISTS', 404);
const check = await compare(password, user.password);

// ✅ BIEN — comprobar status antes de permitir el login
const user = await User.findOne({ email }).select('+password');
if (!user) return handleHttpError(res, 'USER_NOT_EXISTS', 404);

// Validar que el usuario ha verificado su email
if (user.status !== 'verified') {
  return handleHttpError(res, 'USER_NOT_VERIFIED', 403);
}

// Validar que el usuario está activo
if (!user.isActive) {
  return handleHttpError(res, 'USER_INACTIVE', 403);
}

const check = await compare(password, user.password);
if (!check) return handleHttpError(res, 'INVALID_PASSWORD', 401);
```

### Resumen de códigos HTTP que usa el profesor
| Código | Cuándo usarlo |
|--------|--------------|
| 200 | Éxito general |
| 201 | Recurso creado |
| 204 | Eliminado sin contenido |
| 400 | Error de validación / datos incorrectos |
| 401 | No autenticado (sin token o token inválido) |
| 403 | Autenticado pero sin permisos (rol insuficiente, cuenta no verificada) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (email duplicado, recurso ya existe) |
| 429 | Demasiadas peticiones / intentos agotados |
| 500 | Error interno del servidor |

- [ ] `"type": "module"` en package.json (JS) o `tsconfig.json` correcto (TS)
- [ ] `.env` creado y `.env.example` sin valores reales
- [ ] `.gitignore` incluye `node_modules/`, `.env` y `dist/` (si hay TS)
- [ ] `/health` endpoint funciona y devuelve `{ status: 'ok' }`
- [ ] Todos los errores devuelven `{ error: true, message }`
- [ ] `password` nunca aparece en respuestas JSON
- [ ] `validateObjectId()` en todas las rutas con `:id` de MongoDB
- [ ] `notFound` y `errorHandler` al final de app.js
- [ ] Módulos nativos con prefijo `node:`
- [ ] Modelos con `timestamps: true, versionKey: false`
- [ ] Rutas específicas (`/top`, `/me`) antes de `/:id`
- [ ] `models/index.js` exporta todos los modelos
- [ ] Si hay Cloudinary: variables `CLOUDINARY_*` en `.env`
- [ ] Si hay TypeScript: `strict: true` en tsconfig, tipos en `src/types/`
- [ ] Si hay Swagger: `/api-docs` accesible en desarrollo

---

## 13. Checklist antes de entregar

- [ ] `"type": "module"` en package.json (JS) o `tsconfig.json` correcto (TS)
- [ ] Scripts usan `--env-file=.env`, NO `import 'dotenv/config'`
- [ ] `.env` creado y `.env.example` sin valores reales
- [ ] `.gitignore` incluye `node_modules/`, `.env` y `dist/` (si hay TS)
- [ ] `/health` endpoint funciona y devuelve `{ status: 'ok' }`
- [ ] Todos los errores devuelven `{ error: true, message }`
- [ ] `password` nunca aparece en respuestas JSON
- [ ] Campos sensibles con `select: false` (password, códigos de verificación, intentos)
- [ ] Login valida `status === 'verified'` e `isActive` antes de comparar password
- [ ] Rate limit / intentos agotados devuelven 429, no 403
- [ ] `validateObjectId()` en todas las rutas con `:id` de MongoDB
- [ ] `notFound` y `errorHandler` al final de app.js
- [ ] Módulos nativos con prefijo `node:`
- [ ] Modelos con `timestamps: true, versionKey: false`
- [ ] Rutas específicas (`/top`, `/me`) antes de `/:id`
- [ ] `models/index.js` exporta todos los modelos
- [ ] Si hay Cloudinary: variables `CLOUDINARY_*` en `.env`
- [ ] Si hay TypeScript: `strict: true` en tsconfig, tipos en `src/types/`
- [ ] Si hay Swagger: `/api-docs` accesible en desarrollo
