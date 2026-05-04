import request from 'supertest';
import app from '../src/app.js';
import { createVerifiedUser } from './auth.test.js';

const setupWithClient = async (emailSuffix = '') => {
  const email = `proj${emailSuffix}@test.com`;
  const { token } = await createVerifiedUser(email);
  const idx = String(emailSuffix || '0').padStart(8, '0');

  await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({ isFreelance: false, cif: `P${idx}`, name: 'Proj Company SL' });

  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Cliente Proyecto', cif: `C${idx}` });

  return { token, clientId: clientRes.body.data._id };
};

describe('POST /api/project', () => {
  it('debería crear un proyecto', async () => {
    const { token, clientId } = await setupWithClient('1');

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Reforma Oficina', projectCode: 'PRJ-001', client: clientId });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Reforma Oficina');
    expect(res.body.data.projectCode).toBe('PRJ-001');
  });

  it('debería rechazar código de proyecto duplicado', async () => {
    const { token, clientId } = await setupWithClient('2');

    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto A', projectCode: 'DUP-001', client: clientId });

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto B', projectCode: 'DUP-001', client: clientId });

    expect(res.status).toBe(409);
  });

  it('debería rechazar cliente inexistente', async () => {
    const { token } = await setupWithClient('3');
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto X', projectCode: 'PRX-001', client: fakeId });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/project', () => {
  it('debería listar proyectos con paginación', async () => {
    const { token, clientId } = await setupWithClient('4');

    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto 1', projectCode: 'P-001', client: clientId });

    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto 2', projectCode: 'P-002', client: clientId });

    const res = await request(app)
      .get('/api/project?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.totalItems).toBe(2);
  });

  it('debería filtrar por cliente', async () => {
    const { token, clientId } = await setupWithClient('5');

    await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proy Filtrado', projectCode: 'F-001', client: clientId });

    const res = await request(app)
      .get(`/api/project?client=${clientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/project/:id', () => {
  it('debería obtener un proyecto por ID', async () => {
    const { token, clientId } = await setupWithClient('6');

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto Get', projectCode: 'G-001', client: clientId });

    const res = await request(app)
      .get(`/api/project/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Proyecto Get');
  });
});

describe('PUT /api/project/:id', () => {
  it('debería actualizar un proyecto', async () => {
    const { token, clientId } = await setupWithClient('7');

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Viejo', projectCode: 'V-001', client: clientId });

    const res = await request(app)
      .put(`/api/project/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nuevo Nombre' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Nuevo Nombre');
  });
});

describe('DELETE /api/project/:id y restore', () => {
  it('debería archivar y restaurar un proyecto', async () => {
    const { token, clientId } = await setupWithClient('8');

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A Archivar', projectCode: 'AR-001', client: clientId });

    const del = await request(app)
      .delete(`/api/project/${created.body.data._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(200);

    const archived = await request(app)
      .get('/api/project/archived')
      .set('Authorization', `Bearer ${token}`);

    expect(archived.body.data).toHaveLength(1);

    const restored = await request(app)
      .patch(`/api/project/${created.body.data._id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(restored.status).toBe(200);
  });

  it('debería eliminar definitivamente un proyecto', async () => {
    const { token, clientId } = await setupWithClient('9');

    const created = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A Borrar', projectCode: 'BD-001', client: clientId });

    const res = await request(app)
      .delete(`/api/project/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
