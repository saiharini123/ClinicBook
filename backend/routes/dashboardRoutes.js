const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');

// Helper to format date in Indian DD-MM-YYYY
const getTodayIndianDate = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
};

// @route   GET /api/dashboard
// @desc    Get dashboard metrics tailored to Patient, Doctor, or Admin
router.get('/', protect, async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const todayDate = getTodayIndianDate();

    // 1. PATIENT DASHBOARD
    if (role === 'patient') {
      const allAppointments = await Appointment.find({ patient: userId })
        .populate({
          path: 'doctor',
          populate: { path: 'user', select: 'name phone' }
        })
        .sort({ createdAt: -1 });

      const upcoming = allAppointments.filter((a) => a.status === 'scheduled' || a.status === 'in-consultation');
      const completed = allAppointments.filter((a) => a.status === 'completed');
      const todayAppointment = allAppointments.find((a) => a.appointmentDate === todayDate && a.status !== 'cancelled');

      let todayTokenLive = null;
      if (todayAppointment && todayAppointment.doctor) {
        // Find doctor's current serving token for today
        const doctorAppointmentsToday = await Appointment.find({
          doctor: todayAppointment.doctor._id,
          appointmentDate: todayDate,
          status: { $ne: 'cancelled' }
        }).sort({ tokenNumber: 1 });

        const inConsultation = doctorAppointmentsToday.find((a) => a.status === 'in-consultation');
        const completedToday = doctorAppointmentsToday.filter((a) => a.status === 'completed');
        
        let servingToken = 0;
        if (inConsultation) {
          servingToken = inConsultation.tokenNumber;
        } else if (completedToday.length > 0) {
          servingToken = completedToday[completedToday.length - 1].tokenNumber;
        } else if (doctorAppointmentsToday.length > 0) {
          servingToken = 1;
        }

        todayTokenLive = {
          appointmentId: todayAppointment._id,
          tokenNumber: todayAppointment.tokenNumber,
          currentServingToken: servingToken,
          yourTimeSlot: todayAppointment.timeSlot,
          doctorName: todayAppointment.doctor.user ? todayAppointment.doctor.user.name : 'Clinic Specialist',
          clinicName: todayAppointment.doctor.clinicAddress ? todayAppointment.doctor.clinicAddress.clinicName : 'Clinic',
          status: todayAppointment.status,
          patientsAhead: Math.max(0, todayAppointment.tokenNumber - servingToken)
        };
      }

      return res.json({
        success: true,
        role: 'patient',
        todayDate,
        stats: {
          upcomingCount: upcoming.length,
          completedCount: completed.length,
          totalBookings: allAppointments.length
        },
        todayTokenLive,
        recentAppointments: allAppointments.slice(0, 5)
      });
    }

    // 2. DOCTOR DASHBOARD
    if (role === 'doctor') {
      const doctor = await Doctor.findOne({ user: userId });
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
      }

      const todayAppointments = await Appointment.find({
        doctor: doctor._id,
        appointmentDate: todayDate,
        status: { $ne: 'cancelled' }
      }).populate('patient', 'name phone').sort({ tokenNumber: 1 });

      const allDoctorAppointments = await Appointment.find({ doctor: doctor._id });

      const scheduledToday = todayAppointments.filter((a) => a.status === 'scheduled');
      const completedToday = todayAppointments.filter((a) => a.status === 'completed');
      const inConsultationToday = todayAppointments.find((a) => a.status === 'in-consultation');
      const walkInsToday = todayAppointments.filter((a) => a.type === 'walk-in');
      const onlineToday = todayAppointments.filter((a) => a.type === 'online');

      let currentServing = inConsultationToday ? inConsultationToday.tokenNumber : (completedToday.length > 0 ? completedToday[completedToday.length - 1].tokenNumber : 0);

      return res.json({
        success: true,
        role: 'doctor',
        todayDate,
        doctorInfo: {
          id: doctor._id,
          specialization: doctor.specialization,
          degrees: doctor.degrees,
          mciRegNumber: doctor.mciRegNumber,
          consultationFee: doctor.consultationFee,
          clinicName: doctor.clinicAddress.clinicName,
          timeSlots: doctor.timeSlots
        },
        stats: {
          totalToday: todayAppointments.length,
          waitingToday: scheduledToday.length,
          completedToday: completedToday.length,
          walkInsToday: walkInsToday.length,
          onlineToday: onlineToday.length,
          currentServingToken: currentServing,
          totalLifetimeConsultations: allDoctorAppointments.filter((a) => a.status === 'completed').length
        },
        todayQueue: todayAppointments
      });
    }

    // 3. ADMIN DASHBOARD
    if (role === 'admin') {
      const [totalPatients, totalDoctors, totalAppointments] = await Promise.all([
        User.countDocuments({ role: 'patient' }),
        Doctor.countDocuments({ isActive: true }),
        Appointment.countDocuments()
      ]);

      const allAppointments = await Appointment.find()
        .populate({
          path: 'doctor',
          populate: { path: 'user', select: 'name' }
        })
        .populate('patient', 'name phone')
        .sort({ createdAt: -1 });

      // Calculate GST and Revenue metrics
      let totalRevenue = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;
      let walkInCount = 0;
      let onlineCount = 0;

      allAppointments.forEach((apt) => {
        if (apt.status !== 'cancelled') {
          totalRevenue += (apt.gstDetails && apt.gstDetails.totalFee) || 0;
          totalCgst += (apt.gstDetails && apt.gstDetails.cgst) || 0;
          totalSgst += (apt.gstDetails && apt.gstDetails.sgst) || 0;
          totalIgst += (apt.gstDetails && apt.gstDetails.igst) || 0;
        }
        if (apt.type === 'walk-in') walkInCount++;
        else onlineCount++;
      });

      return res.json({
        success: true,
        role: 'admin',
        todayDate,
        stats: {
          totalPatients,
          totalDoctors,
          totalAppointments,
          totalRevenue: Math.round(totalRevenue),
          totalGstCollected: Math.round(totalCgst + totalSgst + totalIgst),
          cgst: Math.round(totalCgst),
          sgst: Math.round(totalSgst),
          igst: Math.round(totalIgst),
          walkInCount,
          onlineCount,
          clinicGstin: '29AAACB1234F1Z8'
        },
        recentBookings: allAppointments.slice(0, 10)
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid user role.' });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error loading dashboard.' });
  }
});

module.exports = router;
