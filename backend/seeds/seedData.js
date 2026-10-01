const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clinicbook_india';

// Helper to get formatted Indian DD-MM-YYYY date
const getIndianDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[ClinicBook Seeder] Connected to MongoDB.');

    // Clear existing collections
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await Notification.deleteMany({});
    console.log('[ClinicBook Seeder] Cleared previous database records.');

    // 1. Create Admin User
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@clinicbook.in',
      phone: '9876543210',
      countryCode: '+91',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true
    });

    // 2. Create Doctors
    const doctor1User = await User.create({
      name: 'Dr. Vikram Rao',
      email: 'dr.vikram@clinicbook.in',
      phone: '9845012345',
      countryCode: '+91',
      password: 'Doctor@123',
      role: 'doctor',
      isVerified: true
    });

    const doc1 = await Doctor.create({
      user: doctor1User._id,
      specialization: 'General Physician',
      category: 'Allopathy',
      clinicType: 'General Clinic',
      degrees: ['MBBS', 'MD (General Medicine)'],
      mciRegNumber: 'NMC-MH-2012-04821',
      experienceYears: 12,
      clinicAddress: {
        clinicName: 'Arogya Family Health Clinic',
        addressLine: '12th Main Road, Near Metro Station, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038'
      },
      consultationFee: 500,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: [
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
      ],
      bio: 'Senior Consultant Physician with over a decade of clinical experience in internal medicine, lifestyle disorders, and preventive healthcare.',
      rating: 4.9
    });

    const doctor2User = await User.create({
      name: 'Dr. Ananya Iyer',
      email: 'dr.ananya@clinicbook.in',
      phone: '9820123456',
      countryCode: '+91',
      password: 'Doctor@123',
      role: 'doctor',
      isVerified: true
    });

    const doc2 = await Doctor.create({
      user: doctor2User._id,
      specialization: 'Ayurveda',
      category: 'AYUSH',
      clinicType: 'General Clinic',
      degrees: ['BAMS', 'MD (Panchakarma)'],
      mciRegNumber: 'CCIM-AYU-2015-10293',
      experienceYears: 9,
      clinicAddress: {
        clinicName: 'AyurVeda Wellness & Panchakarma Clinic',
        addressLine: 'Plot 45, Hill Road, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050'
      },
      consultationFee: 600,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timeSlots: [
        '10:00 AM',
        '10:30 AM',
        '11:00 AM',
        '11:30 AM',
        '04:30 PM',
        '05:00 PM',
        '05:30 PM',
        '06:30 PM'
      ],
      bio: 'Ayurvedic specialist focusing on chronic metabolic issues, joint rejuvenation, digestive health, and authentic Kerala Panchakarma therapies.',
      rating: 4.8
    });

    const doctor3User = await User.create({
      name: 'Dr. Suresh Mukherjee',
      email: 'dr.suresh@clinicbook.in',
      phone: '9811123456',
      countryCode: '+91',
      password: 'Doctor@123',
      role: 'doctor',
      isVerified: true
    });

    const doc3 = await Doctor.create({
      user: doctor3User._id,
      specialization: 'Orthopedic',
      category: 'Specialist',
      clinicType: 'General Clinic',
      degrees: ['MBBS', 'MS (Orthopedics)', 'DNB Ortho'],
      mciRegNumber: 'NMC-DL-2008-09122',
      experienceYears: 16,
      clinicAddress: {
        clinicName: 'Joint & Spine Care Centre',
        addressLine: 'Block C, Inner Circle, Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      consultationFee: 800,
      availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
      timeSlots: ['09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '04:00 PM', '04:30 PM', '05:00 PM'],
      bio: 'Leading orthopedic surgeon specializing in joint preservation, arthritis management, and sports injuries.',
      rating: 4.9
    });

    const doctor4User = await User.create({
      name: 'Dr. Priya Patel',
      email: 'dr.priya@clinicbook.in',
      phone: '9444123456',
      countryCode: '+91',
      password: 'Doctor@123',
      role: 'doctor',
      isVerified: true
    });

    const doc4 = await Doctor.create({
      user: doctor4User._id,
      specialization: 'Dentist',
      category: 'Dental',
      clinicType: 'Dental Clinic',
      degrees: ['BDS', 'MDS (Conservative Dentistry)'],
      mciRegNumber: 'DCI-TN-2016-03418',
      experienceYears: 8,
      clinicAddress: {
        clinicName: 'SmileCraft Dental Studio',
        addressLine: '14, Usman Road, T. Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600017'
      },
      consultationFee: 450,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'],
      bio: 'Expert cosmetic dentist and endodontist offering root canal therapy, teeth whitening, and general dental hygiene.',
      rating: 4.7
    });

    const doctor5User = await User.create({
      name: 'Dr. Fatima Khan',
      email: 'dr.fatima@clinicbook.in',
      phone: '9849123456',
      countryCode: '+91',
      password: 'Doctor@123',
      role: 'doctor',
      isVerified: true
    });

    const doc5 = await Doctor.create({
      user: doctor5User._id,
      specialization: 'Gynecologist',
      category: 'Specialist',
      clinicType: 'Gynecology Clinic',
      degrees: ['MBBS', 'MD (Obstetrics & Gynecology)', 'DGO'],
      mciRegNumber: 'NMC-TS-2014-06190',
      experienceYears: 11,
      clinicAddress: {
        clinicName: 'Mother & Child Care Clinic',
        addressLine: 'Road No 3, Near City Center, Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500034'
      },
      consultationFee: 700,
      availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '04:00 PM', '04:30 PM', '05:00 PM'],
      bio: 'Compassionate gynecologist dedicated to maternal healthcare, PCOS management, and adolescent reproductive health.',
      rating: 4.9
    });

    const doctor6User = await User.create({
      name: 'Dr. Meera Krishnan',
      email: 'dr.meera@clinicbook.in',
      phone: '9845612345',
      countryCode: '+91',
      password: 'Doctor@123',
      role: 'doctor',
      isVerified: true
    });

    const doc6 = await Doctor.create({
      user: doctor6User._id,
      specialization: 'Pediatrician',
      category: 'Specialist',
      clinicType: 'Paediatric Clinic',
      degrees: ['MBBS', 'MD (Pediatrics)'],
      mciRegNumber: 'NMC-KA-2017-08841',
      experienceYears: 7,
      clinicAddress: {
        clinicName: 'Little Steps Child Clinic',
        addressLine: '22, CMH Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038'
      },
      consultationFee: 550,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      timeSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '05:00 PM', '05:30 PM', '06:00 PM'],
      bio: 'Pediatrician focused on child growth monitoring, immunisation schedules, and newborn care.',
      rating: 4.8
    });

    const doctor7User = await User.create({
      name: 'Dr. Arjun Malhotra',
      email: 'dr.arjun@clinicbook.in',
      phone: '9812345670',
      countryCode: '+91',
      password: 'Doctor@123',
      role: 'doctor',
      isVerified: true
    });

    const doc7 = await Doctor.create({
      user: doctor7User._id,
      specialization: 'Cardiologist',
      category: 'Specialist',
      clinicType: 'Heart Clinic',
      degrees: ['MBBS', 'MD (Medicine)', 'DM (Cardiology)'],
      mciRegNumber: 'NMC-DL-2010-05567',
      experienceYears: 14,
      clinicAddress: {
        clinicName: 'HeartCare Clinic & Diagnostics',
        addressLine: '5, Lajpat Nagar Market, Ring Road',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110024'
      },
      consultationFee: 900,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timeSlots: ['09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '04:00 PM', '04:30 PM'],
      bio: 'Interventional cardiologist specialising in hypertension, arrhythmia management and cardiac risk assessment.',
      rating: 4.9
    });

    // 3. Create Patients
    const patient1User = await User.create({
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@example.com',
      phone: '9876501234',
      countryCode: '+91',
      password: 'Patient@123',
      role: 'patient',
      isVerified: true
    });

    const patient1 = await Patient.create({
      user: patient1User._id,
      aadhaarNumberMasked: 'XXXX-XXXX-8921',
      bloodGroup: 'B+',
      dateOfBirth: '14-07-1988',
      gender: 'Male',
      address: {
        street: '14, 5th Cross, 100 Feet Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038'
      },
      emergencyContact: {
        name: 'Sunita Sharma',
        relation: 'Spouse',
        phone: '9876509999'
      },
      familyMembers: [
        {
          name: 'Sunita Sharma',
          relation: 'Spouse',
          age: 34,
          gender: 'Female',
          phone: '9876509999',
          bloodGroup: 'O+'
        },
        {
          name: 'Ramesh Sharma',
          relation: 'Father',
          age: 67,
          gender: 'Male',
          phone: '9876508888',
          bloodGroup: 'B+'
        },
        {
          name: 'Aarav Sharma',
          relation: 'Son',
          age: 7,
          gender: 'Male',
          phone: '',
          bloodGroup: 'B+'
        }
      ]
    });

    const patient2User = await User.create({
      name: 'Priya Deshmukh',
      email: 'priya.deshmukh@example.com',
      phone: '9867012345',
      countryCode: '+91',
      password: 'Patient@123',
      role: 'patient',
      isVerified: true
    });

    await Patient.create({
      user: patient2User._id,
      aadhaarNumberMasked: 'XXXX-XXXX-4532',
      bloodGroup: 'A+',
      dateOfBirth: '22-11-1994',
      gender: 'Female',
      address: {
        street: 'Flat 402, Sai Sagar Apts, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050'
      },
      emergencyContact: {
        name: 'Sachin Deshmukh',
        relation: 'Brother',
        phone: '9867018888'
      },
      familyMembers: []
    });

    // 4. Create Sample Appointments for Today with Tokens and GST details
    const today = getIndianDate(0);
    const tomorrow = getIndianDate(1);

    // Appointment 1: Rajesh booked for Dr. Vikram Rao today morning (Token #1, completed)
    const apt1 = await Appointment.create({
      appointmentNumber: `CB-${today.replace(/-/g, '')}-1001`,
      tokenNumber: 1,
      patient: patient1User._id,
      doctor: doc1._id,
      isFamilyMember: false,
      patientName: 'Rajesh Sharma',
      patientPhone: '9876501234',
      appointmentDate: today,
      timeSlot: '09:30 AM',
      type: 'online',
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'UPI',
      paymentTransactionId: 'UPI-RR-904812348123',
      gstDetails: {
        invoiceNumber: `INV-2026-1001`,
        baseFee: 500,
        gstRate: 18,
        cgst: 45,
        sgst: 45,
        igst: 0,
        totalFee: 590,
        clinicGstin: '29AAACB1234F1Z8',
        sacCode: '999312'
      },
      symptoms: 'Seasonal throat irritation and dry cough for 3 days',
      doctorNotes: 'Mild pharyngitis. Chest is clear. Advised warm saline gargles and hydration.',
      prescription: 'Tab Paracetamol 650mg SOS, Tab Levocetirizine 5mg at bedtime for 5 days.'
    });

    // Appointment 2: Walk-in Patient booked today at reception (Token #2, in-consultation)
    const apt2 = await Appointment.create({
      appointmentNumber: `CB-${today.replace(/-/g, '')}-1002`,
      tokenNumber: 2,
      patient: patient2User._id,
      doctor: doc1._id,
      isFamilyMember: false,
      patientName: 'Priya Deshmukh',
      patientPhone: '9867012345',
      appointmentDate: today,
      timeSlot: '10:00 AM',
      type: 'walk-in',
      status: 'in-consultation',
      paymentStatus: 'paid',
      paymentMethod: 'Cash at Clinic',
      paymentTransactionId: 'CASH-RECVD-98124',
      gstDetails: {
        invoiceNumber: `INV-2026-1002`,
        baseFee: 500,
        gstRate: 18,
        cgst: 45,
        sgst: 45,
        igst: 0,
        totalFee: 590,
        clinicGstin: '29AAACB1234F1Z8',
        sacCode: '999312'
      },
      symptoms: 'Fever and body aches since yesterday',
      doctorNotes: 'Evaluating vital signs and temperature.',
      prescription: ''
    });

    // Appointment 3: Family member booking: Rajesh booked for his Father Ramesh Sharma (Token #3, scheduled)
    const apt3 = await Appointment.create({
      appointmentNumber: `CB-${today.replace(/-/g, '')}-1003`,
      tokenNumber: 3,
      patient: patient1User._id,
      doctor: doc1._id,
      isFamilyMember: true,
      familyMemberDetails: {
        name: 'Ramesh Sharma',
        relation: 'Father',
        age: 67,
        gender: 'Male'
      },
      patientName: 'Ramesh Sharma (Father of Rajesh)',
      patientPhone: '9876501234',
      appointmentDate: today,
      timeSlot: '10:30 AM',
      type: 'online',
      status: 'scheduled',
      paymentStatus: 'pending',
      paymentMethod: 'Cash at Clinic',
      gstDetails: {
        invoiceNumber: `INV-2026-1003`,
        baseFee: 500,
        gstRate: 18,
        cgst: 45,
        sgst: 45,
        igst: 0,
        totalFee: 590,
        clinicGstin: '29AAACB1234F1Z8',
        sacCode: '999312'
      },
      symptoms: 'Routine blood pressure review and knee pain consultation',
      doctorNotes: '',
      prescription: ''
    });

    // Appointment 4: Booking with Dr. Ananya Iyer (Ayurveda) for tomorrow
    const apt4 = await Appointment.create({
      appointmentNumber: `CB-${tomorrow.replace(/-/g, '')}-2001`,
      tokenNumber: 1,
      patient: patient2User._id,
      doctor: doc2._id,
      isFamilyMember: false,
      patientName: 'Priya Deshmukh',
      patientPhone: '9867012345',
      appointmentDate: tomorrow,
      timeSlot: '11:00 AM',
      type: 'online',
      status: 'scheduled',
      paymentStatus: 'paid',
      paymentMethod: 'Google Pay',
      paymentTransactionId: 'UPI-RR-884910294102',
      gstDetails: {
        invoiceNumber: `INV-2026-2001`,
        baseFee: 600,
        gstRate: 18,
        cgst: 54,
        sgst: 54,
        igst: 0,
        totalFee: 708,
        clinicGstin: '27AAACB1234F1Z9',
        sacCode: '999312'
      },
      symptoms: 'Chronic acidity, digestive sluggishness, and sleep disturbances',
      doctorNotes: '',
      prescription: ''
    });

    // 5. Notifications
    await Notification.create({
      recipient: patient1User._id,
      title: 'Token #3 Confirmed for Father',
      message: `Appointment for Ramesh Sharma is confirmed with Dr. Vikram Rao today at 10:30 AM. Token #3.`,
      type: 'booking',
      appointment: apt3._id
    });

    console.log('[ClinicBook Seeder] Sample data seeded successfully!');
    console.log('----------------------------------------------------');
    console.log('DEMO ACCOUNTS FOR INSTANT LOGIN:');
    console.log('1. Patient:   rajesh.sharma@example.com / Patient@123 (Phone: 9876501234)');
    console.log('2. Doctor:    dr.vikram@clinicbook.in / Doctor@123 (Phone: 9845012345)');
    console.log('3. Admin:     admin@clinicbook.in / Admin@123 (Phone: 9876543210)');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[ClinicBook Seeder] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
