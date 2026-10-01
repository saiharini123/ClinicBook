const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    specialization: {
      type: String,
      required: [true, 'Please select doctor specialization'],
      enum: [
        'General Physician',
        'Ayurveda',
        'Homeopathy',
        'Unani',
        'Dentist',
        'Orthopedic',
        'Gynecologist',
        'Pediatrician',
        'Cardiologist',
        'Dermatologist',
        'ENT Specialist'
      ]
    },
    category: {
      type: String,
      enum: ['Allopathy', 'AYUSH', 'Dental', 'Specialist'],
      default: 'Allopathy'
    },
    // Clinic section this doctor appears under on the homepage
    clinicType: {
      type: String,
      enum: ['General Clinic', 'Dental Clinic', 'Paediatric Clinic', 'Gynecology Clinic', 'Heart Clinic'],
      default: 'General Clinic'
    },
    // Dates (DD-MM-YYYY) on which the doctor is unavailable. timeSlots empty = full day off.
    // Appointments affected get auto-rescheduled (see routes/doctorRoutes.js).
    unavailableDates: [
      {
        date: { type: String, required: true }, // DD-MM-YYYY
        timeSlots: { type: [String], default: [] }, // empty = entire day
        reason: { type: String, default: 'Doctor unavailable' },
        markedAt: { type: Date, default: Date.now }
      }
    ],
    degrees: {
      type: [String],
      required: [true, 'Please specify degrees (e.g. MBBS, MD, BAMS)'],
      default: ['MBBS']
    },
    mciRegNumber: {
      type: String,
      required: [true, 'MCI/NMC registration number is mandatory'],
      trim: true
    },
    experienceYears: {
      type: Number,
      required: [true, 'Years of clinical experience required'],
      default: 5
    },
    clinicAddress: {
      clinicName: { type: String, required: true, default: 'City Health Clinic' },
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true }
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee in INR is required'],
      default: 500
    },
    availableDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    timeSlots: {
      type: [String],
      default: [
        '09:30 AM',
        '10:00 AM',
        '10:30 AM',
        '11:00 AM',
        '11:30 AM',
        '04:00 PM',
        '04:30 PM',
        '05:00 PM',
        '05:30 PM',
        '06:00 PM'
      ]
    },
    bio: {
      type: String,
      default: 'Experienced healthcare practitioner committed to holistic patient care.'
    },
    rating: {
      type: Number,
      default: 4.8
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
