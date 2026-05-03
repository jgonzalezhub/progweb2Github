import PDFDocument from 'pdfkit';

export const generateDeliveryNotePDF = (note) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Cabecera ──────────────────────────────────────────────
    doc.fontSize(22).font('Helvetica-Bold').text('ALBARÁN', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Nº: ${note._id}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // ── Datos del usuario ─────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('EMISOR');
    doc.font('Helvetica').fontSize(10);
    if (note.user) {
      doc.text(`Nombre: ${note.user.name || ''} ${note.user.lastName || ''}`.trim());
      doc.text(`Email: ${note.user.email}`);
    }
    doc.moveDown();

    // ── Datos del cliente ─────────────────────────────────────
    if (note.client) {
      doc.fontSize(12).font('Helvetica-Bold').text('CLIENTE');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Nombre: ${note.client.name}`);
      doc.text(`CIF: ${note.client.cif}`);
      if (note.client.email) doc.text(`Email: ${note.client.email}`);
      if (note.client.phone) doc.text(`Teléfono: ${note.client.phone}`);
      if (note.client.address?.city) {
        doc.text(
          `Dirección: ${note.client.address.street || ''} ${note.client.address.number || ''}, ${note.client.address.postal || ''} ${note.client.address.city}`
        );
      }
      doc.moveDown();
    }

    // ── Datos del proyecto ────────────────────────────────────
    if (note.project) {
      doc.fontSize(12).font('Helvetica-Bold').text('PROYECTO');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Nombre: ${note.project.name}`);
      doc.text(`Código: ${note.project.projectCode}`);
      doc.moveDown();
    }

    // ── Datos del albarán ─────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('DETALLES DEL ALBARÁN');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Formato: ${note.format === 'hours' ? 'Horas' : 'Material'}`);
    if (note.description) doc.text(`Descripción: ${note.description}`);
    doc.text(`Fecha de trabajo: ${new Date(note.workDate).toLocaleDateString('es-ES')}`);
    doc.moveDown(0.5);

    if (note.format === 'material') {
      doc.text(`Material: ${note.material || '-'}`);
      doc.text(`Cantidad: ${note.quantity} ${note.unit || ''}`);
    } else {
      if (note.workers?.length > 0) {
        doc.text('Trabajadores:');
        note.workers.forEach((w) => doc.text(`  • ${w.name}: ${w.hours} h`));
      } else {
        doc.text(`Horas totales: ${note.hours}`);
      }
    }

    // ── Firma ─────────────────────────────────────────────────
    if (note.signed) {
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold').text('FIRMADO', { align: 'right' });
      doc.font('Helvetica').fontSize(10).text(
        `Fecha de firma: ${new Date(note.signedAt).toLocaleDateString('es-ES')}`,
        { align: 'right' }
      );
    }

    doc.end();
  });
};
