import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la sala es requerido'],
      trim: true,
      unique: true,
      minlength: [2, 'Mínimo 2 caracteres'],
      maxlength: [50, 'Máximo 50 caracteres']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Máximo 200 caracteres']
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true, versionKey: false }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;
