import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../src/app.js';
import { createVerifiedUser } from './auth.test.js';

// Mock storage service para evitar llamadas a Cloudinary en tests
jest.unstable_mockModule('../src/services/storage.service.js', () => ({
  uploadImage: jest.fn().mockResolvedValue({
    secure_url: 'https://res.cloudinary.com/test/image/upload/test_signature.webp',
    public_id: 'bildyapp/signatures/test'
  }),
  uploadPDF: jest.fn().mockResolvedValue({
    secure_url: 'https://res.cloudinary.com/test/raw/upload/test_pdf.pdf',
    public_id: 'bildyapp/pdfs/test'
  }),
  deleteFile: jest.fn().mockResolvedValue({ result: 'ok' })
}));

const setupFull = async (emailSuffix = '') => {
  const email = `dn${emailSuffix}@test.com`;
  const { token } = await createVerifiedUser(email);
  const idx = String(emailSuffix || '0').padStart(8, '0');

  await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({ isFreelance: false, cif: `D${idx}`, name: 'DN Company SL' });

  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'DN Cliente', cif: `E${idx}` });

  const projectRes = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Proyecto DN',
      projectCode: `DN-${emailSuffix || '0'}01`,
      client: clientRes.body.data._id
    });

  return {
    token,
    clientId: clientRes.body.data._id,
    projectId: projectRes.body.data._id
  };
};

describe('POST /api/deliverynote', () => {
  it('debería crear albarán de horas', async () => {
    const { token, projectId } = await setupFull('1');

    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        format: 'hours',
        description: 'Trabajo de pintura',
        workDate: '2025-01-15',
        hours: 8
      });

    expect(res.status).toBe(201);
    expect(res.body.data.format).toBe('hours');
    expect(res.body.data.hours).toBe(8);
  });

  it('debería crear albarán de material', async () => {
    const { token, projectId } = await setupFull('2');

    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        format: 'material',
        description: 'Suministro de azulejos',
        workDate: '2025-01-16',
        material: 'Azulejos cerámicos',
        quantity: 50,
        unit: 'm2'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.format).toBe('material');
    expect(res.body.data.material).toBe('Azulejos cerámicos');
  });

  it('debería crear albarán con múltiples trabajadores', async () => {
    const { token, projectId } = await setupFull('3');

    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        format: 'hours',
        workers: [
          { name: 'Juan López', hours: 8 },
          { name: 'María García', hours: 6 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.workers).toHaveLength(2);
  });

  it('debería rechazar proyecto inexistente', async () => {
    const { token } = await setupFull('4');
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: fakeId, format: 'hours', hours: 4 });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/deliverynote', () => {
  it('debería listar albaranes con paginación', async () => {
    const { token, projectId } = await setupFull('5');

    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: projectId, format: 'hours', hours: 4 });

    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: projectId, format: 'hours', hours: 6 });

    const res = await request(app)
      .get('/api/deliverynote?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.totalItems).toBe(2);
  });

  it('debería filtrar por format', async () => {
    const { token, projectId } = await setupFull('6');

    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: projectId, format: 'hours', hours: 4 });

    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId,
        format: 'material',
        material: 'Cemento',
        quantity: 10,
        unit: 'kg'
      });

    const res = await request(app)
      .get('/api/deliverynote?format=material')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].format).toBe('material');
  });
});

describe('GET /api/deliverynote/:id', () => {
  it('debería obtener albarán con populate', async () => {
    const { token, projectId } = await setupFull('7');

    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: projectId, format: 'hours', hours: 4 });

    const res = await request(app)
      .get(`/api/deliverynote/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.client).toBeDefined();
    expect(res.body.data.project).toBeDefined();
  });
});

describe('GET /api/deliverynote/pdf/:id', () => {
  it('debería generar y descargar PDF', async () => {
    const { token, projectId } = await setupFull('8');

    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: projectId, format: 'hours', hours: 4 });

    const res = await request(app)
      .get(`/api/deliverynote/pdf/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });
});

describe('DELETE /api/deliverynote/:id', () => {
  it('debería eliminar albarán no firmado', async () => {
    const { token, projectId } = await setupFull('9');

    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: projectId, format: 'hours', hours: 4 });

    const res = await request(app)
      .delete(`/api/deliverynote/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('no debería eliminar albarán firmado', async () => {
    const { token, projectId } = await setupFull('10');

    // Crear albarán
    const created = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: projectId, format: 'hours', hours: 4 });

    // Firmar directamente via modelo para simular firma
    const DeliveryNote = (await import('../src/models/DeliveryNote.js')).default;
    await DeliveryNote.findByIdAndUpdate(created.body.data._id, {
      signed: true,
      signedAt: new Date(),
      signatureUrl: 'https://example.com/sig.webp'
    });

    const res = await request(app)
      .delete(`/api/deliverynote/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('CANNOT_DELETE_SIGNED_NOTE');
  });
});
