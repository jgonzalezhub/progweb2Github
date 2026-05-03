import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true
    },
    cif: {
      type: String,
      required: [true, 'El CIF es requerido'],
      trim: true,
      uppercase: true
    },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      number: { type: String, trim: true },
      postal: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true }
    },
    deleted: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

clientSchema.index({ company: 1, cif: 1 }, { unique: true });
clientSchema.index({ company: 1, deleted: 1 });

const Client = mongoose.model('Client', clientSchema);
export default Client;
