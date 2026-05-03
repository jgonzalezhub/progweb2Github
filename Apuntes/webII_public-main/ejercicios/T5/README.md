# 🎬 Ejercicio T5: BlockBuster API

## El Videoclub del Futuro (que ya es pasado)

## 📖 Historia

Un millonario excéntrico y nostálgico quiere recrear la experiencia de los videoclubs de los 90s, pero con tecnología moderna. Te ha contratado para crear la API que gestione su catálogo de películas y el sistema de alquiler.

El sistema debe permitir a los usuarios ver el catálogo, alquilar películas (si hay copias disponibles), devolverlas, y consultar estadísticas de las más populares.

## 📋 Requisitos

### Modelo Movie

```javascript
{
  title: String,        // Requerido, mín 2 caracteres
  director: String,     // Requerido
  year: Number,         // Entre 1888 y año actual
  genre: String,        // Enum: action, comedy, drama, horror, scifi
  copies: Number,       // Total de copias (default: 5)
  availableCopies: Number, // Copias disponibles
  timesRented: Number,  // Contador de alquileres (default: 0)
  cover: String         // Nombre del archivo de carátula (default: null)
}
```

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/movies | Listar películas (filtro: `?genre=comedy`) |
| GET | /api/movies/:id | Obtener película por ID |
| POST | /api/movies | Crear nueva película |
| PUT | /api/movies/:id | Actualizar película |
| DELETE | /api/movies/:id | Eliminar película |
| POST | /api/movies/:id/rent | Alquilar película |
| POST | /api/movies/:id/return | Devolver película |
| PATCH | /api/movies/:id/cover | Subir/reemplazar carátula (multipart) |
| GET | /api/movies/:id/cover | Obtener imagen de carátula |
| GET | /api/movies/stats/top | Top 5 más alquiladas |

### Lógica de negocio

1. **Alquilar**: Decrementa `availableCopies`, incrementa `timesRented`
2. **Devolver**: Incrementa `availableCopies` (sin exceder `copies`)
3. **Validar**: No permitir alquilar si `availableCopies === 0`

### Carátulas (Multer)

1. **Subir carátula**: Enviar imagen con `multipart/form-data` (campo `cover`). Solo imágenes (jpeg, png, webp, gif), máximo 5 MB
2. **Reemplazar**: Si la película ya tiene carátula, se elimina la anterior al subir una nueva
3. **Obtener**: `GET /api/movies/:id/cover` devuelve la imagen directamente. También accesible en `/uploads/<filename>`
4. **Eliminar película**: Al borrar una película, se elimina también su archivo de carátula

## 🚀 Ejecutar

```bash
cd ejercicios/T5
npm install
cp .env.example .env
# Editar .env con tu MONGODB_URI
npm run dev
```

## 🧪 Tests

Usa el archivo `tests/movies.http` con la extensión REST Client de VS Code.

## 🎯 Criterios de éxito

- [ ] CRUD completo de películas funcionando
- [ ] Filtro por género implementado
- [ ] Sistema de alquiler/devolución con validaciones
- [ ] Estadísticas de top 5 películas
- [ ] Manejo de errores apropiado (404, 400, etc.)
- [ ] Validaciones en el modelo Mongoose
- [ ] Subida de carátula con Multer funcionando
- [ ] Endpoint GET para recuperar la carátula

## 🎁 BONUS

- Añadir paginación a GET /api/movies (`?page=1&limit=10`)
- Implementar búsqueda por título (`?search=matrix`)
- Añadir campo `rating` y endpoint para valorar películas
- Crear endpoint `/api/movies/available` que solo muestre películas con copias disponibles
