import request from 'supertest';
import app from '../src/app.js';
import { createVerifiedUser } from './auth.test.js';

const setupUserWithCompany = async (emailSuffix = '') => {
  const email = `client${emailSuffix}@test.com`;
  const { token } = await createVerifiedUser(email);
  const idx = String(emailSuffix || '0').padStart(8, '0');
  await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({ isFreelance: false, cif: `B${idx}`, name: 'Test Company SL' });
  return { token };
};

describe('POST /api/client', () => {
  it('debería crear un cliente', async () => {
    const { token } = await setupUserWithCompany('1');

    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme Corp', cif: 'A11111111', email: 'acme@test.com' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Acme Corp');
  });

  it('debería rechazar CIF duplicado en la misma empresa', async () => {
    const { token } = await setupUserWithCompany('2');

    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cliente 1', cif: 'A22222222' });

    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cliente 2', cif: 'A22222222' });

    expect(res.status).toBe(409);
  });

  it('debería rechazar sin autenticación', async () => {
    const res = await request(app)
      .post('/api/client')
      .send({ name: 'Test', cif: 'A33333333' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/client', () => {
  it('debería listar clientes con paginación', async () => {
    const { token } = await setupUserWithCompany('3');

    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cliente A', cif: 'A44444441' });

    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cliente B', cif: 'A44444442' });

    const res = await request(app)
      .get('/api/client?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.totalItems).toBe(2);
    expect(res.body.totalPages).toBe(1);
    expect(res.body.currentPage).toBe(1);
  });

  it('debería filtrar por nombre', async () => {
    const { token } = await setupUserWithCompany('4');

    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'García SL', cif: 'A55555551' });

    await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'López SA', cif: 'A55555552' });

    const res = await request(app)
      .get('/api/client?name=García')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('García SL');
  });
});

describe('GET /api/client/:id', () => {
  it('debería obtener un cliente por ID', async () => {
    const { token } = await setupUserWithCompany('5');

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Client', cif: 'A66666661' });

    const res = await request(app)
      .get(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(created.body.data._id);
  });

  it('debería retornar 404 para cliente inexistente', async () => {
    const { token } = await setupUserWithCompany('6');
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .get(`/api/client/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/client/:id', () => {
  it('debería actualizar un cliente', async () => {
    const { token } = await setupUserWithCompany('7');

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Viejo Nombre', cif: 'A77777771' });

    const res = await request(app)
      .put(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nuevo Nombre' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Nuevo Nombre');
  });
});

describe('DELETE /api/client/:id', () => {
  it('debería archivar un cliente (soft delete)', async () => {
    const { token } = await setupUserWithCompany('8');

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A Archivar', cif: 'A88888881' });

    const res = await request(app)
      .delete(`/api/client/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('archivado');
  });

  it('debería eliminar definitivamente un cliente (hard delete)', async () => {
    const { token } = await setupUserWithCompany('9');

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A Eliminar', cif: 'A99999991' });

    const res = await request(app)
      .delete(`/api/client/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('eliminado');
  });
});

describe('GET /api/client/archived y PATCH /api/client/:id/restore', () => {
  it('debería listar archivados y restaurar', async () => {
    const { token } = await setupUserWithCompany('10');

    const created = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Para Restaurar', cif: 'B10101010' });

    await request(app)
      .delete(`/api/client/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    const archived = await request(app)
      .get('/api/client/archived')
      .set('Authorization', `Bearer ${token}`);

    expect(archived.status).toBe(200);
    expect(archived.body.data).toHaveLength(1);

    const restored = await request(app)
      .patch(`/api/client/${created.body.data._id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(restored.status).toBe(200);
    expect(restored.body.message).toContain('restaurado');

    const archivedAfter = await request(app)
      .get('/api/client/archived')
      .set('Authorization', `Bearer ${token}`);

    expect(archivedAfter.body.data).toHaveLength(0);
  });
});
