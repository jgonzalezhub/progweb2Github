import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Variables de entorno mínimas para tests (JWT_SECRET obligatorio)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_minimum_32_chars_ok';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_key_minimum_32ok';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});
