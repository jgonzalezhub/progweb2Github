import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({}, { timestamps: true, versionKey: false });

const User = mongoose.model('User', userSchema);
export default User;
