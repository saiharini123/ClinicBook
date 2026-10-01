const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relation: {
    type: String,
    enum: ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Sibling', 'Other'],
    required: true
  },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  phone: { type: String, default: '' },
  bloodGroup: { type: String, default: 'Not specified' }
});

const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    aadhaarNumberMasked: {
      type: String,
      default: '',
      trim: true
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown'
    },
    dateOfBirth: {
      type: String,
      default: ''
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male'
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' }
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    familyMembers: [familyMemberSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
