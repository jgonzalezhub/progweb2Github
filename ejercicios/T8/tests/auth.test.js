// tests/auth.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';

const TEST_URI = process.env.MONGODB_TEST_URI;
const BASE = '/api/auth';

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await mongoose.connection.collection('users').deleteMany({});
});

const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

describe('POST /api/auth/register', () => {
  test('201 con usuario creado', async () => {
    const res = await request(app).post(`${BASE}/register`).send(validUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', validUser.email);
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('400 si email duplicado', async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
    const res = await request(app).post(`${BASE}/register`).send(validUser);
    expect(res.status).toBe(400);
  });

  test('400 si faltan campos', async () => {
    const res = await request(app).post(`${BASE}/register`).send({ name: 'Test' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
  });

  test('201 con token cuando credenciales válidas', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  test('401 si contraseña incorrecta', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: validUser.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  test('200 con datos del usuario (requiere token)', async () => {
    const reg = await request(app).post(`${BASE}/register`).send(validUser);
    const { token } = reg.body;

    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('email', validUser.email);
  });

  test('401 sin token', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
  });
});
