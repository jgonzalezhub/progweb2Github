// src/models/user.model.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 99 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    age: { type: Number, min: 0 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('User', userSchema);
