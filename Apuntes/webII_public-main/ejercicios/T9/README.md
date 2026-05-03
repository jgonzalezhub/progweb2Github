# Ejercicio T9: API de Biblioteca con Supabase + Prisma

## Descripción

Construye una API REST para gestionar una biblioteca digital usando **Supabase** como base de datos PostgreSQL y **Prisma** como ORM.

## Historia

La biblioteca municipal quiere digitalizar su sistema de préstamos. Los usuarios podrán:
- Consultar el catálogo de libros
- Solicitar préstamos (máximo 3 libros simultáneos)
- Dejar reseñas con puntuación
- Los administradores gestionan el inventario

## Requisitos

### Modelos de datos

```
User
├── id (autoincrement)
├── email (unique)
├── name
├── password (hash)
├── role (USER | LIBRARIAN | ADMIN)
├── loans[] (relación)
└── reviews[] (relación)

Book
├── id (autoincrement)
├── isbn (unique)
├── title
├── author
├── genre
├── description (opcional)
├── publishedYear
├── copies (número de ejemplares)
├── available (ejemplares disponibles)
├── loans[] (relación)
└── reviews[] (relación)

Loan
├── id (autoincrement)
├── userId (FK → User)
├── bookId (FK → Book)
├── loanDate
├── dueDate (fecha límite)
├── returnDate (nullable)
└── status (ACTIVE | RETURNED | OVERDUE)

Review
├── id (autoincrement)
├── userId (FK → User)
├── bookId (FK → Book)
├── rating (1-5)
├── comment (opcional)
├── createdAt
└── (unique: userId + bookId)
```

### Endpoints

#### Auth
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | /api/auth/register | Registrar usuario | Público |
| POST | /api/auth/login | Iniciar sesión | Público |
| GET | /api/auth/me | Obtener perfil | Autenticado |

#### Books
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | /api/books | Listar libros (con filtros) | Público |
| GET | /api/books/:id | Obtener libro por ID | Público |
| POST | /api/books | Crear libro | Librarian/Admin |
| PUT | /api/books/:id | Actualizar libro | Librarian/Admin |
| DELETE | /api/books/:id | Eliminar libro | Admin |

#### Loans
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | /api/loans | Mis préstamos | Autenticado |
| GET | /api/loans/all | Todos los préstamos | Librarian/Admin |
| POST | /api/loans | Solicitar préstamo | Autenticado |
| PUT | /api/loans/:id/return | Devolver libro | Autenticado |

#### Reviews
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | /api/books/:id/reviews | Reseñas de un libro | Público |
| POST | /api/books/:id/reviews | Crear reseña | Autenticado |
| DELETE | /api/reviews/:id | Eliminar mi reseña | Autenticado |

### Reglas de negocio

1. **Préstamos**:
   - Un usuario puede tener máximo 3 préstamos activos
   - No puede pedir prestado el mismo libro dos veces
   - Solo se puede prestar si hay ejemplares disponibles
   - Duración del préstamo: 14 días

2. **Reseñas**:
   - Solo una reseña por usuario por libro
   - Rating entre 1 y 5
   - Solo usuarios que hayan leído el libro pueden reseñar (tengan préstamo devuelto)

3. **Inventario**:
   - `copies`: total de ejemplares
   - `available`: ejemplares disponibles para préstamo
   - Al prestar: `available--`
   - Al devolver: `available++`

## Configuración

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Copia el `DATABASE_URL` de Settings → Database

### 2. Instalar dependencias

```bash
cd ejercicios/T9
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Ejecutar migraciones

```bash
npx prisma migrate dev --name init
```

### 5. (Opcional) Sembrar datos de prueba

```bash
npx prisma db seed
```

### 6. Iniciar servidor

```bash
npm run dev
```

## Scripts

```bash
npm run dev          # Servidor con hot-reload
npm start            # Servidor en producción
npm run db:studio    # Abrir Prisma Studio
npm run db:migrate   # Crear migración
npm run db:push      # Sincronizar schema sin migración
npm run db:seed      # Sembrar datos de prueba
npm test             # Ejecutar tests
```

## Estructura del proyecto

```
T9/
├── prisma/
│   ├── schema.prisma      # Definición de modelos
│   ├── migrations/        # Historial de migraciones
│   └── seed.js           # Datos de prueba
├── src/
│   ├── app.js            # Configuración Express
│   ├── config/
│   │   └── prisma.js     # Cliente Prisma
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── books.controller.js
│   │   ├── loans.controller.js
│   │   └── reviews.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── books.routes.js
│   │   ├── loans.routes.js
│   │   └── reviews.routes.js
│   ├── schemas/
│   │   └── validation.js
│   └── utils/
│       ├── password.js
│       └── jwt.js
├── tests/
│   └── api.http          # Tests con REST Client
├── .env.example
├── package.json
└── README.md
```

## Criterios de éxito

- [ ] Prisma schema con todos los modelos y relaciones
- [ ] Migraciones aplicadas correctamente en Supabase
- [ ] CRUD completo de libros
- [ ] Sistema de préstamos funcionando
- [ ] Control de inventario (available)
- [ ] Reseñas con validación
- [ ] Autenticación JWT
- [ ] Manejo de errores de Prisma

## Bonus

- [ ] Documentación Swagger
- [ ] Tests con Jest + Supertest
- [ ] Filtros avanzados (género, autor, disponibilidad)
- [ ] Paginación en listados
- [ ] Endpoint de estadísticas (libros más prestados, mejores valorados)
- [ ] Notificación de préstamos vencidos

## Recursos

- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Teoría T9 - Supabase + Prisma](../../teoria/T9.md)
