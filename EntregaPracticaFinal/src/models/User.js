import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [8, 'Mínimo 8 caracteres'],
      select: false
    },
    name: { type: String, trim: true, default: null },
    lastName: { type: String, trim: true, default: null },
    nif: { type: String, trim: true, default: null },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true },
      postalCode: { type: String, trim: true }
    },
    role: { type: String, enum: ['admin', 'guest'], default: 'admin' },
    status: { type: String, enum: ['pending', 'verified'], default: 'pending' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    emailVerificationCode: { type: String, default: null, select: false },
    emailVerificationAttempts: { type: Number, default: 0, select: false }, // corrección: select:false
    refreshToken: { type: String, default: null, select: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

userSchema.virtual('fullName').get(function () {
  if (this.name && this.lastName) return `${this.name} ${this.lastName}`;
  if (this.name) return this.name;
  return null;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

userSchema.methods.toJSON = function () {
  const user = this.toObject({ virtuals: true });
  delete user.password;
  delete user.emailVerificationCode;
  delete user.refreshToken;
  delete user.emailVerificationAttempts;
  return user;
};

userSchema.index({ company: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
