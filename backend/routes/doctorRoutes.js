const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/doctor
// @desc    Get all doctors with filtering by specialization, category (AYUSH/Allopathy), city, state
router.get('/', async (req, res) => {
  try {
    const { specialization, category, clinicType, city, state, search } = req.query;
    let query = { isActive: true };

    // homepage section filter (Dental Clinic / Paediatric Clinic / etc.)
    if (clinicType && clinicType !== 'All') {
      query.clinicType = clinicType;
    }

    if (specialization && specialization !== 'All') {
      query.specialization = specialization;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (city) {
      query['clinicAddress.city'] = new RegExp(city, 'i');
    }

    if (state) {
      query['clinicAddress.state'] = new RegExp(state, 'i');
    }

    let doctors = await Doctor.find(query).populate('user', 'name email phone countryCode');

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      doctors = doctors.filter((doc) => {
        const doctorName = doc.user ? doc.user.name : '';
        const clinicName = doc.clinicAddress ? doc.clinicAddress.clinicName : '';
        const spec = doc.specialization || '';
        return (
          searchRegex.test(doctorName) ||
          searchRegex.test(clinicName) ||
          searchRegex.test(spec)
        );
      });
    }

    return res.json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    console.error('[Doctor List API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor directory.'
    });
  }
});

// @route   GET /api/doctor/:id
// @desc    Get single doctor details by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email phone countryCode');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found in clinic records.'
      });
    }

    return res.json({
      success: true,
      doctor
    });
  } catch (error) {
    console.error('[Doctor Details API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching doctor profile.'
    });
  }
});

// @route   GET /api/doctor/:id/available-slots
// @desc    Check available 12-hour slots for a doctor on a specific DD-MM-YYYY date
router.get('/:id/available-slots', async (req, res) => {
  try {
    const { date } = req.query; // format: DD-MM-YYYY
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an appointment date in DD-MM-YYYY format (e.g. 15-09-2026).'
      });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.'
      });
    }

    // Find all active (non-cancelled) bookings for this doctor on this specific DD-MM-YYYY date
    const bookedAppointments = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: date,
      status: { $ne: 'cancelled' }
    }).select('timeSlot tokenNumber status patientName');

    const bookedSlotMap = {};
    bookedAppointments.forEach((apt) => {
      bookedSlotMap[apt.timeSlot] = {
        isBooked: true,
        tokenNumber: apt.tokenNumber,
        status: apt.status
      };
    });

    // doctor unavailability for this date (leave / blocked slots)
    const unavailability = (doctor.unavailableDates || []).find((u) => u.date === date);
    const isFullDayOff = unavailability && (unavailability.timeSlots || []).length === 0;
    const blockedSlots = unavailability ? (unavailability.timeSlots || []) : [];

    // Map through doctor's configured timeSlots
    const slotList = (doctor.timeSlots || []).map((slot) => {
      const isBooked = !!bookedSlotMap[slot];
      const isBlocked = isFullDayOff || blockedSlots.includes(slot);
      return {
        slot, // e.g. "10:30 AM"
        isAvailable: !isBooked && !isBlocked,
        isBlocked,
        reason: isFullDayOff ? (unavailability.reason || 'Doctor unavailable') : isBlocked ? (unavailability.reason || 'Doctor unavailable') : null,
        tokenNumber: isBooked ? bookedSlotMap[slot].tokenNumber : null
      };
    });

    return res.json({
      success: true,
      date,
      doctorId: doctor._id,
      totalSlots: slotList.length,
      availableSlotsCount: slotList.filter((s) => s.isAvailable).length,
      slots: slotList
    });
  } catch (error) {
    console.error('[Doctor Available Slots API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute slot availability.'
    });
  }
});

// @route   POST /api/doctor
// @desc    Create/Add a new doctor profile (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      userId,
      specialization,
      category,
      degrees,
      mciRegNumber,
      experienceYears,
      clinicAddress,
      consultationFee,
      timeSlots,
      bio
    } = req.body;

    const doctor = await Doctor.create({
      user: userId,
      specialization,
      category: category || 'Allopathy',
      degrees: Array.isArray(degrees) ? degrees : [degrees],
      mciRegNumber,
      experienceYears: Number(experienceYears) || 3,
      clinicAddress,
      consultationFee: Number(consultationFee) || 500,
      timeSlots: timeSlots && timeSlots.length > 0 ? timeSlots : undefined,
      bio
    });

    return res.status(201).json({
      success: true,
      message: 'Doctor profile added to clinic registry successfully.',
      doctor
    });
  } catch (error) {
    console.error('[Create Doctor API] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create doctor profile.'
    });
  }
});

// @route   PUT /api/doctor/:id
// @desc    Update doctor profile (Doctor themselves or Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Check authorization: doctor owner or admin
    if (req.user.role !== 'admin' && doctor.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are only authorized to edit your own doctor profile.'
      });
    }

    const fieldsToUpdate = [
      'specialization',
      'category',
      'degrees',
      'mciRegNumber',
      'experienceYears',
      'clinicAddress',
      'consultationFee',
      'availableDays',
      'timeSlots',
      'bio',
      'isActive'
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    await doctor.save();

    return res.json({
      success: true,
      message: 'Doctor profile updated successfully.',
      doctor
    });
  } catch (error) {
    console.error('[Update Doctor API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update doctor profile.'
    });
  }
});

// @route   DELETE /api/doctor/:id
// @desc    Deactivate/Remove doctor profile (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    doctor.isActive = false;
    await doctor.save();

    return res.json({
      success: true,
      message: 'Doctor deactivated from clinic bookings.'
    });
  } catch (error) {
    console.error('[Delete Doctor API] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST /api/doctor/:id/unavailable
// @desc    Mark a doctor unavailable on a date (full day or specific slots).
//          Any active appointments that collide are AUTO-RESCHEDULED to the doctor's
//          next available slot, and patients get a notification. Used by doctors
//          (own profile) and admins.
router.post('/:id/unavailable', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }
    if (req.user.role !== 'admin' && doctor.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only manage your own availability.' });
    }

    const { date, timeSlots = [], reason = 'Doctor unavailable' } = req.body;
    if (!date || !/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'Please provide the date in DD-MM-YYYY format.' });
    }

    // don't add the same date twice; replace if it exists
    doctor.unavailableDates = (doctor.unavailableDates || []).filter((u) => u.date !== date);
    doctor.unavailableDates.push({ date, timeSlots, reason, markedAt: new Date() });
    await doctor.save();

    // ---- AUTO RESCHEDULE affected appointments ----
    const isFullDay = !timeSlots || timeSlots.length === 0;
    const slotFilter = isFullDay ? { $exists: true } : { $in: timeSlots };

    const affected = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: date,
      timeSlot: slotFilter,
      status: { $in: ['scheduled', 'in-consultation'] }
    }).sort({ tokenNumber: 1 });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const results = [];

    // helper: is a given date+slot open for this doctor?
    const isSlotOpen = async (checkDate, slot) => {
      const dParts = checkDate.split('-');
      const dObj = new Date(Number(dParts[2]), Number(dParts[1]) - 1, Number(dParts[0]));
      if (!(doctor.availableDays || []).includes(dayNames[dObj.getDay()])) return false;
      const blocked = (doctor.unavailableDates || []).find((u) => {
        if (u.date !== checkDate) return false;
        return (u.timeSlots || []).length === 0 || (u.timeSlots || []).includes(slot);
      });
      if (blocked) return false;
      const clash = await Appointment.findOne({
        doctor: doctor._id,
        appointmentDate: checkDate,
        timeSlot: slot,
        status: { $ne: 'cancelled' }
      });
      return !clash;
    };

    for (const apt of affected) {
      let rescheduled = false;
      // if only some slots are blocked and the appointment's slot is not among them, skip
      if (!isFullDay && !timeSlots.includes(apt.timeSlot)) continue;

      // search the next 30 days for the earliest free slot, same slot time preferred first
      const [d, m, y] = date.split('-').map(Number);
      for (let dayOffset = 0; dayOffset <= 30 && !rescheduled; dayOffset++) {
        const cand = new Date(y, m - 1, d + dayOffset);
        const cDate = `${String(cand.getDate()).padStart(2, '0')}-${String(cand.getMonth() + 1).padStart(2, '0')}-${cand.getFullYear()}`;
        // try the same slot first, then the rest in order
        const candidateSlots = [apt.timeSlot, ...(doctor.timeSlots || []).filter((s) => s !== apt.timeSlot)];
        for (const slot of candidateSlots) {
          if (dayOffset === 0 && slot === apt.timeSlot) continue; // that one is blocked, obviously
          if (await isSlotOpen(cDate, slot)) {
            const oldDate = apt.appointmentDate;
            const dailyCount = await Appointment.countDocuments({
              _id: { $ne: apt._id },
              doctor: doctor._id,
              appointmentDate: cDate,
              status: { $ne: 'cancelled' }
            });
            apt.appointmentDate = cDate;
            apt.timeSlot = slot;
            apt.tokenNumber = dailyCount + 1;
            await apt.save();
            await Notification.create({
              recipient: apt.patient,
              title: 'Appointment Auto-Rescheduled',
              message: `${doctor.clinicAddress.clinicName} is unavailable on ${date}${reason && reason !== 'Doctor unavailable' ? ` (${reason})` : ''}. Your appointment has been automatically rescheduled from ${oldDate} to ${cDate} at ${slot}. Token #${apt.tokenNumber}.`,
              type: 'cancellation',
              appointment: apt._id
            });
            results.push({ appointmentId: apt._id, patientName: apt.patientName, oldDate, newDate: cDate, newSlot: slot, tokenNumber: apt.tokenNumber });
            rescheduled = true;
            break;
          }
        }
      }
      if (!rescheduled) {
        // no free slot found within 30 days — cancel and inform
        apt.status = 'cancelled';
        await apt.save();
        await Notification.create({
          recipient: apt.patient,
          title: 'Appointment Cancelled',
          message: `Unfortunately your appointment on ${date} at ${apt.timeSlot} could not be rescheduled automatically (no available slot within 30 days). Please book a new slot. We apologise for the inconvenience.`,
          type: 'cancellation',
          appointment: apt._id
        });
        results.push({ appointmentId: apt._id, patientName: apt.patientName, cancelled: true });
      }
    }

    return res.json({
      success: true,
      message: `Doctor marked unavailable on ${date}${isFullDay ? ' (full day)' : ` for ${(timeSlots).length} slot(s)`}. ${results.length} appointment(s) auto-rescheduled.`,
      autoRescheduled: results
    });
  } catch (error) {
    console.error('[Doctor Unavailable API] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while marking unavailability.' });
  }
});

// @route   DELETE /api/doctor/:id/unavailable/:date
// @desc    Remove an unavailability marking (doctor is available again that day)
router.delete('/:id/unavailable/:date', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    if (req.user.role !== 'admin' && doctor.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not allowed.' });
    }
    doctor.unavailableDates = (doctor.unavailableDates || []).filter((u) => u.date !== req.params.date);
    await doctor.save();
    return res.json({ success: true, message: `Availability restored for ${req.params.date}.`, unavailableDates: doctor.unavailableDates });
  } catch (error) {
    console.error('[Remove Unavailability] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
