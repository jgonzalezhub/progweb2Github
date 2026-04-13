import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El propietario es requerido']
    },
    name: {
      type: String,
      required: [true, 'El nombre de la empresa es requerido'],
      trim: true,
      minlength: [2, 'Mínimo 2 caracteres'],
      maxlength: [100, 'Máximo 100 caracteres']
    },
    cif: {
      type: String,
      required: [true, 'El CIF es requerido'],
      unique: true,
      trim: true,
      uppercase: true
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true },
      postalCode: { type: String, trim: true }
    },
    logo: {
      type: String,
      default: null
    },
    isFreelance: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// cif ya indexado por unique: true en el schema
companySchema.index({ owner: 1 });

const Company = mongoose.model('Company', companySchema);
export default Company;
