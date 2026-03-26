// tests/podcasts.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/user.model.js';
import Podcast from '../src/models/podcast.model.js';
import { encrypt } from '../src/utils/handlePassword.js';

const TEST_URI = process.env.MONGODB_TEST_URI;
const BASE = '/api/podcasts';
const AUTH = '/api/auth';

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Podcast.deleteMany({});
});

const podcastData = {
  title: 'Test Podcast',
  description: 'A test podcast description that is long enough',
  category: 'tech',
  duration: 3600,
  episodes: 5
};

const getToken = async (email, role = 'user') => {
  const password = await encrypt('password123');
  await User.create({ name: 'Test User', email, password, role });
  const res = await request(app)
    .post(`${AUTH}/login`)
    .send({ email, password: 'password123' });
  return res.body.token;
};

describe('GET /api/podcasts', () => {
  test('200 con array (solo publicados)', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.podcasts)).toBe(true);
  });
});

describe('POST /api/podcasts', () => {
  test('201 con podcast creado (requiere token)', async () => {
    const token = await getToken('creator@test.com');
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(podcastData);
    expect(res.status).toBe(201);
    expect(res.body.podcast).toHaveProperty('title', podcastData.title);
  });

  test('401 sin token', async () => {
    const res = await request(app).post(BASE).send(podcastData);
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/podcasts/:id', () => {
  test('200 solo para admin', async () => {
    const userToken = await getToken('user@test.com', 'user');
    const adminToken = await getToken('admin@test.com', 'admin');

    const podRes = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${userToken}`)
      .send(podcastData);
    const podcastId = podRes.body.podcast._id;

    const res = await request(app)
      .delete(`${BASE}/${podcastId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('403 para user normal', async () => {
    const userToken = await getToken('user2@test.com', 'user');
    const adminToken = await getToken('admin2@test.com', 'admin');

    const podRes = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${userToken}`)
      .send(podcastData);
    const podcastId = podRes.body.podcast._id;

    const res = await request(app)
      .delete(`${BASE}/${podcastId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/podcasts/admin/all', () => {
  test('200 solo para admin', async () => {
    const adminToken = await getToken('admin3@test.com', 'admin');
    const res = await request(app)
      .get(`${BASE}/admin/all`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.podcasts)).toBe(true);
  });
});
