import { generateDeliveryNotePDF } from '../src/services/pdf.service.js';

const baseNote = {
  _id: '507f1f77bcf86cd799439011',
  format: 'hours',
  description: 'Trabajo de prueba',
  workDate: new Date('2025-03-15'),
  hours: 8,
  workers: [],
  signed: false,
  user: { name: 'Juan', lastName: 'García', email: 'juan@test.com' },
  client: {
    name: 'Acme Corp',
    cif: 'A12345678',
    email: 'acme@test.com',
    phone: '612345678',
    address: { street: 'Calle Mayor', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' }
  },
  project: { name: 'Reforma', projectCode: 'PRJ-001', address: {} }
};

describe('generateDeliveryNotePDF', () => {
  it('debería generar PDF de albarán de horas', async () => {
    const buf = await generateDeliveryNotePDF(baseNote);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(100);
  });

  it('debería generar PDF con múltiples trabajadores', async () => {
    const note = {
      ...baseNote,
      workers: [
        { name: 'Carlos', hours: 8 },
        { name: 'Ana', hours: 6 }
      ]
    };
    const buf = await generateDeliveryNotePDF(note);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('debería generar PDF de albarán de material', async () => {
    const note = {
      ...baseNote,
      format: 'material',
      material: 'Cemento',
      quantity: 50,
      unit: 'kg'
    };
    const buf = await generateDeliveryNotePDF(note);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('debería generar PDF firmado con fecha de firma', async () => {
    const note = {
      ...baseNote,
      signed: true,
      signedAt: new Date('2025-03-16'),
      signatureUrl: 'https://example.com/sig.webp'
    };
    const buf = await generateDeliveryNotePDF(note);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('debería funcionar sin cliente ni proyecto', async () => {
    const note = { ...baseNote, client: null, project: null };
    const buf = await generateDeliveryNotePDF(note);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });
});
