const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Helper to generate readable appointment number
const generateAppointmentNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CB-${dateStr}-${randomSuffix}`;
};

// @route   GET /api/appointment
// @desc    Get appointments based on logged in user's role and query parameters
router.get('/', protect, async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const { date, status, type, doctorId } = req.query;

    let query = {};

    if (role === 'patient') {
      // Patient sees only their appointments
      query.patient = userId;
    } else if (role === 'doctor') {
      // Find doctor profile for this user
      const doctorProfile = await Doctor.findOne({ user: userId });
      if (!doctorProfile) {
        return res.json({ success: true, count: 0, appointments: [] });
      }
      query.doctor = doctorProfile._id;
    } else if (role === 'admin') {
      if (doctorId) query.doctor = doctorId;
    }

    if (date) query.appointmentDate = date;
    if (status && status !== 'All') query.status = status;
    if (type && type !== 'All') query.type = type;

    const appointments = await Appointment.find(query)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('patient', 'name email phone')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('[Appointment List API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments.'
    });
  }
});

// @route   POST /api/appointment
// @desc    Book a new appointment with Slot Conflict Prevention, Token Assignment, and GST breakdown
router.post('/', protect, async (req, res) => {
  try {
    const {
      doctorId,
      appointmentDate, // DD-MM-YYYY format
      timeSlot,        // 12-hour AM/PM format (e.g. "10:30 AM")
      type = 'online',
      isFamilyMember = false,
      familyMemberDetails,
      patientName,
      patientPhone,
      symptoms = '',
      paymentMethod = 'Pending',
      patientState = 'Karnataka' // used for CGST+SGST vs IGST
    } = req.body;

    // 1. Validation of mandatory parameters
    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, Appointment Date (DD-MM-YYYY), and Time Slot are mandatory.'
      });
    }

    // 2. Verify Doctor exists
    const doctor = await Doctor.findById(doctorId).populate('user', 'name');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Selected doctor is not available in our registry.'
      });
    }

    // 3. DATE/TIME SLOT CONFLICT VALIDATION
    // Check if any non-cancelled booking already occupies this exact doctor, date, and timeSlot
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: appointmentDate.trim(),
      timeSlot: timeSlot.trim(),
      status: { $ne: 'cancelled' }
    });

    if (conflictingAppointment) {
      return res.status(409).json({
        success: false,
        message: `Conflict: The time slot ${timeSlot} on ${appointmentDate} has already been reserved for Token #${conflictingAppointment.tokenNumber}. Please choose another available slot.`
      });
    }

    // 4. Calculate Daily Token Number for this Doctor on this Date
    const dailyCount = await Appointment.countDocuments({
      doctor: doctorId,
      appointmentDate: appointmentDate.trim()
    });
    const tokenNumber = dailyCount + 1;

    // 5. Compute GST Tax Details
    const baseFee = doctor.consultationFee || 500;
    const gstRate = 18; // 18% standard GST for consultation
    const isSameState = (doctor.clinicAddress.state || 'Karnataka').toLowerCase() === (patientState || 'Karnataka').toLowerCase();
    
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isSameState) {
      cgst = Number(((baseFee * 9) / 100).toFixed(2));
      sgst = Number(((baseFee * 9) / 100).toFixed(2));
    } else {
      igst = Number(((baseFee * 18) / 100).toFixed(2));
    }
    const totalFee = Number((baseFee + cgst + sgst + igst).toFixed(2));
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // 6. Name and phone handling (self vs family member)
    const finalPatientName = isFamilyMember && familyMemberDetails && familyMemberDetails.name
      ? familyMemberDetails.name.trim()
      : (patientName || req.user.name);

    const finalPatientPhone = patientPhone || req.user.phone;

    // 7. Create Appointment
    const appointment = await Appointment.create({
      appointmentNumber: generateAppointmentNumber(),
      tokenNumber,
      patient: req.user._id,
      doctor: doctorId,
      isFamilyMember,
      familyMemberDetails: isFamilyMember ? familyMemberDetails : undefined,
      patientName: finalPatientName,
      patientPhone: finalPatientPhone,
      appointmentDate: appointmentDate.trim(),
      timeSlot: timeSlot.trim(),
      type: type === 'walk-in' ? 'walk-in' : 'online',
      status: 'scheduled',
      paymentStatus: paymentMethod === 'Cash at Clinic' ? 'pending' : (paymentMethod !== 'Pending' ? 'paid' : 'pending'),
      paymentMethod,
      gstDetails: {
        invoiceNumber,
        baseFee,
        gstRate,
        cgst,
        sgst,
        igst,
        totalFee,
        clinicGstin: '29AAACB1234F1Z8',
        sacCode: '999312' // Healthcare Services SAC code
      },
      symptoms
    });

    // 8. Create Notification for Patient
    await Notification.create({
      recipient: req.user._id,
      title: `Token #${tokenNumber} Confirmed!`,
      message: `Your appointment with Dr. ${doctor.user ? doctor.user.name : 'Specialist'} is confirmed for ${appointmentDate} at ${timeSlot}. Token Number: ${tokenNumber}.`,
      type: 'booking',
      appointment: appointment._id
    });

    // Populate for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('patient', 'name email phone');

    return res.status(201).json({
      success: true,
      message: `Appointment booked successfully! Your Token Number is #${tokenNumber}.`,
      tokenNumber,
      appointment: populatedAppointment
    });
  } catch (error) {
    console.error('[Create Appointment API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to book appointment. Please verify details and try again.'
    });
  }
});

// @route   GET /api/appointment/queue-status/:doctorId
// @desc    Get live token queue status for a doctor on a specific date
router.get('/queue-status/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // DD-MM-YYYY

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date in DD-MM-YYYY format'
      });
    }

    // guard against invalid mongo ids (kept crashing the endpoint earlier)
    if (!/^[0-9a-fA-F]{24}$/.test(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor id.' });
    }

    const appointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: date,
      status: { $ne: 'cancelled' }
    }).sort({ tokenNumber: 1 });

    const totalBookings = appointments.length;
    const inConsultation = appointments.find((a) => a.status === 'in-consultation');
    const completedList = appointments.filter((a) => a.status === 'completed');
    const waitingList = appointments.filter((a) => a.status === 'scheduled');

    // Currently serving token is either the one in-consultation, or last completed + 1, or 1 if nobody yet
    let currentServingToken = 0;
    if (inConsultation) {
      currentServingToken = inConsultation.tokenNumber;
    } else if (completedList.length > 0) {
      currentServingToken = completedList[completedList.length - 1].tokenNumber;
    } else if (appointments.length > 0) {
      currentServingToken = appointments[0].tokenNumber;
    }

    return res.json({
      success: true,
      date,
      doctorId,
      totalTokensToday: totalBookings,
      currentServingToken,
      waitingCount: waitingList.length,
      completedCount: completedList.length,
      queue: appointments.map((apt) => ({
        id: apt._id,
        tokenNumber: apt.tokenNumber,
        timeSlot: apt.timeSlot,
        patientName: apt.patientName,
        status: apt.status,
        type: apt.type
      }))
    });
  } catch (error) {
    console.error('[Queue Status API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate queue status.'
    });
  }
});

// @route   PUT /api/appointment/:id/reschedule
// @desc    Reschedule an appointment to a new date/slot (prepone or postpone).
//          Validates: date format, past dates, doctor's slot list, day availability,
//          and slot conflicts. Keeps the same token when the date is unchanged.
router.put('/:id/reschedule', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Authorization: the patient who booked, the doctor, or an admin
    const isOwner = appointment.patient.toString() === req.user._id.toString();
    let isDoctor = false;
    if (req.user.role === 'doctor') {
      const docProfile = await Doctor.findOne({ user: req.user._id });
      isDoctor = docProfile && docProfile._id.toString() === appointment.doctor.toString();
    }
    if (!isOwner && !isDoctor && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only reschedule your own appointments.'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This appointment was cancelled. Please book a new one.' });
    }
    if (appointment.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Completed consultations cannot be rescheduled.' });
    }

    const { newDate, newTimeSlot } = req.body;
    if (!newDate || !newTimeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both the new date (DD-MM-YYYY) and new time slot (e.g. 10:30 AM).'
      });
    }

    // date must be proper DD-MM-YYYY
    const dateParts = newDate.split('-');
    if (dateParts.length !== 3 || !/^\d{2}-\d{2}-\d{4}$/.test(newDate)) {
      return res.status(400).json({ success: false, message: 'Date must be in DD-MM-YYYY format (e.g. 20-09-2026).' });
    }
    const newDateObj = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]));
    if (isNaN(newDateObj.getTime())) {
      return res.status(400).json({ success: false, message: 'That date does not exist. Please check the DD-MM-YYYY value.' });
    }

    // cannot reschedule into the past (today is allowed)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDateObj < today) {
      return res.status(400).json({ success: false, message: 'New date cannot be in the past. Prepone is only possible within today\'s slots.' });
    }

    const doctor = await Doctor.findById(appointment.doctor);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile no longer exists.' });
    }

    // slot must be one of the doctor's configured slots
    if (!(doctor.timeSlots || []).includes(newTimeSlot.trim())) {
      return res.status(400).json({
        success: false,
        message: `Selected time slot is not offered by this doctor. Available: ${(doctor.timeSlots || []).join(', ')}`
      });
    }

    // day of week check
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (!(doctor.availableDays || []).includes(dayNames[newDateObj.getDay()])) {
      return res.status(400).json({
        success: false,
        message: `Dr. ${doctor.clinicAddress.clinicName} does not consult on ${dayNames[newDateObj.getDay()]}s. Please pick another day.`
      });
    }

    // doctor unavailability check (marked leave / blocked slots)
    const blocked = (doctor.unavailableDates || []).find((u) => {
      if (u.date !== newDate.trim()) return false;
      return (u.timeSlots || []).length === 0 || (u.timeSlots || []).includes(newTimeSlot.trim());
    });
    if (blocked) {
      return res.status(409).json({
        success: false,
        message: `Doctor is unavailable on ${newDate}${blocked.reason && blocked.reason !== 'Doctor unavailable' ? ` (${blocked.reason})` : ''}. Please pick another date.`
      });
    }

    // slot conflict with another booking
    if (newDate.trim() !== appointment.appointmentDate || newTimeSlot.trim() !== appointment.timeSlot) {
      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctor: appointment.doctor,
        appointmentDate: newDate.trim(),
        timeSlot: newTimeSlot.trim(),
        status: { $ne: 'cancelled' }
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Conflict: ${newTimeSlot} on ${newDate} is already taken (Token #${conflict.tokenNumber}). Choose a different slot.`
        });
      }
    }

    const oldDate = appointment.appointmentDate;
    const oldSlot = appointment.timeSlot;

    // token number: keep it if the date did not change, otherwise take the next token of the new day
    if (newDate.trim() !== oldDate) {
      const dailyCount = await Appointment.countDocuments({
        _id: { $ne: appointment._id },
        doctor: appointment.doctor,
        appointmentDate: newDate.trim(),
        status: { $ne: 'cancelled' }
      });
      appointment.tokenNumber = dailyCount + 1;
    }

    appointment.appointmentDate = newDate.trim();
    appointment.timeSlot = newTimeSlot.trim();
    await appointment.save();

    // direction of change for a human-readable message
    const oldD = oldDate.split('-').reverse().join('-');
    const newD = newDate.split('-').reverse().join('-');
    let direction = 'time slot changed for';
    if (newD < oldD) direction = 'preponed to';
    else if (newD > oldD) direction = 'postponed to';

    await Notification.create({
      recipient: appointment.patient,
      title: `Appointment ${direction === 'time slot changed for' ? 'Rescheduled' : direction === 'preponed to' ? 'Preponed' : 'Postponed'}`,
      message: `Your appointment with ${doctor.clinicAddress.clinicName} was ${direction} ${appointment.appointmentDate} at ${appointment.timeSlot}. Token #${appointment.tokenNumber}.`,
      type: 'booking',
      appointment: appointment._id
    });

    const populated = await Appointment.findById(appointment._id)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name phone' } });

    return res.json({
      success: true,
      message: `Appointment ${direction} ${appointment.appointmentDate} at ${appointment.timeSlot}. Token #${appointment.tokenNumber}.`,
      appointment: populated
    });
  } catch (error) {
    console.error('[Reschedule API] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while rescheduling. Please try again.' });
  }
});

// @route   GET /api/appointment/:id
// @desc    Get full appointment details by ID (including GST Invoice)
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('patient', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    return res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('[Appointment Details API] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PUT /api/appointment/:id
// @desc    Update appointment status (Doctor/Admin: scheduled -> in-consultation -> completed, or add prescription)
router.put('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const { status, paymentStatus, paymentMethod, doctorNotes, prescription } = req.body;

    if (status) appointment.status = status;
    if (paymentStatus) appointment.paymentStatus = paymentStatus;
    if (paymentMethod) appointment.paymentMethod = paymentMethod;
    if (doctorNotes !== undefined) appointment.doctorNotes = doctorNotes;
    if (prescription !== undefined) appointment.prescription = prescription;

    await appointment.save();

    // Notify patient if status changed
    if (status) {
      await Notification.create({
        recipient: appointment.patient,
        title: `Appointment Status Updated: ${status.toUpperCase()}`,
        message: `Your appointment (Token #${appointment.tokenNumber}) status has been updated to "${status}".`,
        type: 'token_update',
        appointment: appointment._id
      });
    }

    return res.json({
      success: true,
      message: 'Appointment updated successfully.',
      appointment
    });
  } catch (error) {
    console.error('[Update Appointment API] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating appointment.' });
  }
});

// @route   DELETE /api/appointment/:id
// @desc    Cancel appointment
router.delete('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    return res.json({
      success: true,
      message: `Appointment (Token #${appointment.tokenNumber}) has been cancelled successfully. The slot is now available for other patients.`
    });
  } catch (error) {
    console.error('[Cancel Appointment API] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
