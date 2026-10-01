const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: {
      type: String,
      required: true,
      unique: true
    },
    tokenNumber: {
      type: Number,
      required: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true
    },
    isFamilyMember: {
      type: Boolean,
      default: false
    },
    familyMemberDetails: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      age: { type: Number, default: 0 },
      gender: { type: String, default: '' }
    },
    patientName: {
      type: String,
      required: true
    },
    patientPhone: {
      type: String,
      required: true
    },
    // Required DD-MM-YYYY format
    appointmentDate: {
      type: String,
      required: [true, 'Appointment date is required in DD-MM-YYYY format']
    },
    // Required 12-hour AM/PM format (e.g. "10:30 AM")
    timeSlot: {
      type: String,
      required: [true, 'Time slot in 12-hour AM/PM format is required']
    },
    type: {
      type: String,
      enum: ['online', 'walk-in'],
      default: 'online'
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-consultation', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'PhonePe', 'Google Pay', 'Paytm', 'Razorpay', 'Cash at Clinic', 'Stripe', 'Pending'],
      default: 'Pending'
    },
    paymentTransactionId: {
      type: String,
      default: ''
    },
    gstDetails: {
      invoiceNumber: { type: String, default: '' },
      baseFee: { type: Number, default: 0 },
      gstRate: { type: Number, default: 18 },
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      totalFee: { type: Number, default: 0 },
      clinicGstin: { type: String, default: '29ABCDE1234F1Z5' },
      sacCode: { type: String, default: '999312' }
    },
    symptoms: {
      type: String,
      default: ''
    },
    doctorNotes: {
      type: String,
      default: ''
    },
    prescription: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Compound index to help rapidly validate date/time slot conflict per doctor
appointmentSchema.index({ doctor: 1, appointmentDate: 1, timeSlot: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
