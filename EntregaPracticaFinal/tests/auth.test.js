import request from 'supertest';
import app from '../src/app.js';

// Helper para crear y verificar un usuario
export const createVerifiedUser = async (email = 'test@example.com', password = 'password123') => {
  // Registrar
  const reg = await request(app)
    .post('/api/user/register')
    .send({ email, password });

  const token = reg.body.token;

  // Obtener código de verificación directamente del modelo
  const User = (await import('../src/models/User.js')).default;
  const user = await User.findOne({ email }).select('+emailVerificationCode +emailVerificationAttempts');
  const code = user.emailVerificationCode;

  // Verificar email
  await request(app)
    .put('/api/user/validation')
    .set('Authorization', `Bearer ${token}`)
    .send({ code });

  return { token, email, password };
};

describe('POST /api/user/register', () => {
  it('debería registrar un nuevo usuario', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'nuevo@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('nuevo@test.com');
  });

  it('debería rechazar email duplicado', async () => {
    await request(app)
      .post('/api/user/register')
      .send({ email: 'dup@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'dup@test.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('debería rechazar email inválido', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'noemail', password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('debería rechazar contraseña corta', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'test2@test.com', password: 'short' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/user/validation', () => {
  it('debería verificar el email con código correcto', async () => {
    const reg = await request(app)
      .post('/api/user/register')
      .send({ email: 'valid@test.com', password: 'password123' });

    const User = (await import('../src/models/User.js')).default;
    const user = await User.findOne({ email: 'valid@test.com' }).select('+emailVerificationCode');

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({ code: user.emailVerificationCode });

    expect(res.status).toBe(200);
    expect(res.body.user.status).toBe('verified');
  });

  it('debería rechazar código incorrecto', async () => {
    const reg = await request(app)
      .post('/api/user/register')
      .send({ email: 'bad@test.com', password: 'password123' });

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({ code: '000000' });

    expect(res.status).toBe(400);
  });

  it('debería retornar 429 después de 3 intentos fallidos', async () => {
    const reg = await request(app)
      .post('/api/user/register')
      .send({ email: 'limit@test.com', password: 'password123' });

    for (let i = 0; i < 3; i++) {
      await request(app)
        .put('/api/user/validation')
        .set('Authorization', `Bearer ${reg.body.token}`)
        .send({ code: '000000' });
    }

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({ code: '000000' });

    expect(res.status).toBe(429);
  });
});

describe('POST /api/user/login', () => {
  it('debería rechazar login si el email no está verificado', async () => {
    await request(app)
      .post('/api/user/register')
      .send({ email: 'unver@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'unver@test.com', password: 'password123' });

    expect(res.status).toBe(403);
  });

  it('debería hacer login con email verificado', async () => {
    await createVerifiedUser('loginok@test.com');

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'loginok@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('debería rechazar contraseña incorrecta', async () => {
    await createVerifiedUser('wrongpass@test.com');

    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'wrongpass@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('debería rechazar usuario inexistente', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'noexist@test.com', password: 'password123' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/user', () => {
  it('debería retornar el usuario autenticado', async () => {
    const { token } = await createVerifiedUser('getme@test.com');

    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('getme@test.com');
  });

  it('debería rechazar sin token', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/user/register (onboarding personal)', () => {
  it('debería actualizar datos personales', async () => {
    const { token } = await createVerifiedUser('onboard@test.com');

    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Juan', lastName: 'García', nif: '12345678A' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Juan');
  });
});

describe('PATCH /api/user/company', () => {
  it('debería crear una empresa', async () => {
    const { token } = await createVerifiedUser('company@test.com');

    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({ isFreelance: false, cif: 'B12345678', name: 'Mi Empresa SL' });

    expect(res.status).toBe(201);
    expect(res.body.data.company).toBeDefined();
  });

  it('debería unirse a empresa existente', async () => {
    const { token: token1 } = await createVerifiedUser('admin@test.com');
    await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token1}`)
      .send({ isFreelance: false, cif: 'C87654321', name: 'Empresa Compartida SL' });

    const { token: token2 } = await createVerifiedUser('guest@test.com');
    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token2}`)
      .send({ isFreelance: false, cif: 'C87654321', name: 'Empresa Compartida SL' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('unido');
  });
});

describe('DELETE /api/user', () => {
  it('debería eliminar usuario (hard delete)', async () => {
    const { token } = await createVerifiedUser('del@test.com');

    const res = await request(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('debería archivar usuario (soft delete)', async () => {
    const { token } = await createVerifiedUser('soft@test.com');

    const res = await request(app)
      .delete('/api/user?soft=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /health', () => {
  it('debería retornar estado del servidor', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBeDefined();
  });
});
