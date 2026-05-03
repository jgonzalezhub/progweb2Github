import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema(
  { name: { type: String, trim: true }, hours: { type: Number } },
  { _id: false }
);

const deliveryNoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    format: {
      type: String,
      enum: ['material', 'hours'],
      required: [true, 'El formato es requerido']
    },
    description: { type: String, trim: true },
    workDate: { type: Date, default: Date.now },
    // Para format: 'material'
    material: { type: String, trim: true },
    quantity: { type: Number },
    unit: { type: String, trim: true },
    // Para format: 'hours'
    hours: { type: Number },
    workers: [workerSchema],
    // Firma
    signed: { type: Boolean, default: false },
    signedAt: { type: Date, default: null },
    signatureUrl: { type: String, default: null },
    pdfUrl: { type: String, default: null },
    deleted: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

deliveryNoteSchema.index({ company: 1, deleted: 1 });
deliveryNoteSchema.index({ company: 1, project: 1 });
deliveryNoteSchema.index({ company: 1, client: 1 });
deliveryNoteSchema.index({ workDate: -1 });

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);
export default DeliveryNote;
