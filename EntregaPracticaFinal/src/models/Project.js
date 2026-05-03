import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    name: {
      type: String,
      required: [true, 'El nombre del proyecto es requerido'],
      trim: true
    },
    projectCode: {
      type: String,
      required: [true, 'El código de proyecto es requerido'],
      trim: true
    },
    address: {
      street: { type: String, trim: true },
      number: { type: String, trim: true },
      postal: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true }
    },
    email: { type: String, trim: true, lowercase: true },
    notes: { type: String, trim: true },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

projectSchema.index({ company: 1, projectCode: 1 }, { unique: true });
projectSchema.index({ company: 1, client: 1 });
projectSchema.index({ company: 1, deleted: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
