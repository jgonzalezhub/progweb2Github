import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({}, { timestamps: true, versionKey: false });

const Company = mongoose.model('Company', companySchema);
export default Company;
