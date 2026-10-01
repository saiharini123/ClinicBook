const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { protect } = require('../middleware/auth');

// @route   GET /api/patient/me
// @desc    Get current patient profile with family members
router.get('/me', protect, async (req, res) => {
  try {
    let patient = await Patient.findOne({ user: req.user._id }).populate('user', 'name email phone countryCode');
    if (!patient) {
      patient = await Patient.create({
        user: req.user._id,
        address: { city: 'Bengaluru', state: 'Karnataka', pincode: '560038' },
        familyMembers: []
      });
      patient = await Patient.findById(patient._id).populate('user', 'name email phone countryCode');
    }

    return res.json({
      success: true,
      patient
    });
  } catch (error) {
    console.error('[Patient Me API] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving patient profile.' });
  }
});

// @route   PUT /api/patient/me
// @desc    Update patient profile, blood group, masked Aadhaar, address, emergency contact
router.put('/me', protect, async (req, res) => {
  try {
    let patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      patient = new Patient({ user: req.user._id });
    }

    const { aadhaarNumber, bloodGroup, dateOfBirth, gender, address, emergencyContact } = req.body;

    if (aadhaarNumber) {
      const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
      if (cleanAadhaar.length === 12) {
        patient.aadhaarNumberMasked = `XXXX-XXXX-${cleanAadhaar.slice(-4)}`;
      }
    }

    if (bloodGroup) patient.bloodGroup = bloodGroup;
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (address) patient.address = { ...patient.address, ...address };
    if (emergencyContact) patient.emergencyContact = { ...patient.emergencyContact, ...emergencyContact };

    await patient.save();

    return res.json({
      success: true,
      message: 'Patient profile updated successfully.',
      patient
    });
  } catch (error) {
    console.error('[Update Patient API] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

// @route   POST /api/patient/family
// @desc    Add a family member to the patient profile (common for Indian households)
router.post('/family', protect, async (req, res) => {
  try {
    const { name, relation, age, gender, phone, bloodGroup } = req.body;

    if (!name || !relation || !age) {
      return res.status(400).json({
        success: false,
        message: 'Name, Relationship (e.g. Father, Mother, Child), and Age are required.'
      });
    }

    let patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      patient = new Patient({ user: req.user._id });
    }

    patient.familyMembers.push({
      name: name.trim(),
      relation,
      age: Number(age),
      gender: gender || 'Male',
      phone: phone ? phone.trim() : '',
      bloodGroup: bloodGroup || 'Not specified'
    });

    await patient.save();

    return res.status(201).json({
      success: true,
      message: `Added family member ${name} (${relation}) successfully.`,
      familyMembers: patient.familyMembers
    });
  } catch (error) {
    console.error('[Add Family Member API] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add family member.' });
  }
});

// @route   DELETE /api/patient/family/:memberId
// @desc    Remove a family member
router.delete('/family/:memberId', protect, async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    patient.familyMembers = patient.familyMembers.filter(
      (m) => m._id.toString() !== req.params.memberId
    );

    await patient.save();

    return res.json({
      success: true,
      message: 'Family member removed.',
      familyMembers: patient.familyMembers
    });
  } catch (error) {
    console.error('[Delete Family Member API] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete family member.' });
  }
});

module.exports = router;
