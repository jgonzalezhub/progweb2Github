// src/docs/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'PodcastHub API',
      version: '1.0.0',
      description: 'API REST para gestión de podcasts con autenticación JWT y roles'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      responses: {
        ErrorResponse: {
          description: 'Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            name: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
            role: { type: 'string', enum: ['user', 'admin'], default: 'user' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, example: 'Juan Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
            password: { type: 'string', minLength: 8, example: 'password123' },
            role: { type: 'string', enum: ['user', 'admin'] }
          }
        },
        Login: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
            password: { type: 'string', example: 'password123' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        Podcast: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            title: { type: 'string', example: 'Tech Talk' },
            description: { type: 'string', example: 'Un podcast sobre tecnología' },
            author: { $ref: '#/components/schemas/User' },
            category: {
              type: 'string',
              enum: ['tech', 'science', 'history', 'comedy', 'news'],
              example: 'tech'
            },
            duration: { type: 'integer', example: 3600 },
            episodes: { type: 'integer', example: 10 },
            published: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        PodcastInput: {
          type: 'object',
          required: ['title', 'description'],
          properties: {
            title: { type: 'string', minLength: 3, example: 'Tech Talk' },
            description: { type: 'string', minLength: 10, example: 'Un podcast sobre tecnología moderna' },
            category: {
              type: 'string',
              enum: ['tech', 'science', 'history', 'comedy', 'news']
            },
            duration: { type: 'integer', minimum: 60, example: 3600 },
            episodes: { type: 'integer', minimum: 1, example: 10 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Error message' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);
