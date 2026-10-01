const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { protect, JWT_SECRET } = require('../middleware/auth');

// Helper to sign JWT
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new patient or doctor
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      countryCode = '+91',
      password,
      role = 'patient',
      aadhaarNumber,
      // Doctor-specific fields if registering as doctor
      specialization,
      clinicType,
      degrees,
      mciRegNumber,
      consultationFee,
      clinicName,
      clinicAddressLine,
      city,
      state,
      pincode
    } = req.body;

    // Validate essential inputs
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all mandatory fields: Full Name, Email, Mobile Number, and Password.'
      });
    }

    // Check if phone or email already registered
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: phone.trim() }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address or Indian mobile number already exists. Please try logging in.'
      });
    }

    // Create User account
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone.trim(),
      countryCode,
      password,
      role: role === 'doctor' ? 'doctor' : role === 'admin' ? 'admin' : 'patient',
      isVerified: true
    });

    // If Patient: create Patient document with optional masked Aadhaar
    if (user.role === 'patient') {
      let maskedAadhaar = '';
      if (aadhaarNumber && aadhaarNumber.replace(/\D/g, '').length === 12) {
        const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
        maskedAadhaar = `XXXX-XXXX-${cleanAadhaar.slice(-4)}`;
      }

      await Patient.create({
        user: user._id,
        aadhaarNumberMasked: maskedAadhaar,
        address: {
          city: city || 'Bengaluru',
          state: state || 'Karnataka',
          pincode: pincode || '560038'
        }
      });
    }

    // If Doctor: create Doctor document with degrees and NMC/MCI registration
    if (user.role === 'doctor') {
      await Doctor.create({
        user: user._id,
        specialization: specialization || 'General Physician',
        clinicType: clinicType || 'General Clinic',
        degrees: degrees ? (Array.isArray(degrees) ? degrees : [degrees]) : ['MBBS'],
        mciRegNumber: mciRegNumber || `NMC-${state || 'IND'}-${Date.now().toString().slice(-5)}`,
        consultationFee: consultationFee ? Number(consultationFee) : 500,
        clinicAddress: {
          clinicName: clinicName || `${name}'s Family Clinic`,
          addressLine: clinicAddressLine || 'Main Road, Near Metro Station',
          city: city || 'Bengaluru',
          state: state || 'Karnataka',
          pincode: pincode || '560038'
        }
      });
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: `Registration successful! Welcome to ClinicBook India, ${user.name}.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        countryCode: user.countryCode,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[Auth Register] Error during registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error encountered during registration. Please check your details and try again.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user via Email/Phone and Password
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both your registered email/phone number and password.'
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { phone: identifier.trim() },
        { phone: identifier.replace(/[^0-9]/g, '') }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email or mobile number. Please check the digits or register first.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password entered. Please try again or use OTP login.'
      });
    }

    const token = generateToken(user._id);

    // Fetch role-specific details
    let roleDetails = null;
    if (user.role === 'doctor') {
      roleDetails = await Doctor.findOne({ user: user._id });
    } else if (user.role === 'patient') {
      roleDetails = await Patient.findOne({ user: user._id });
    }

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        countryCode: user.countryCode,
        role: user.role,
        roleDetails
      }
    });
  } catch (error) {
    console.error('[Auth Login] Error during login:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while logging you in. Please try again.'
    });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Simulate sending 6-digit OTP to Indian mobile number
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number to receive OTP.'
      });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    // Use fixed deterministic demo OTP for testing convenience or generate 6-digit
    const demoOtp = '123456';
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    let user = await User.findOne({ phone: cleanPhone });
    if (user) {
      user.otpCode = demoOtp;
      user.otpExpiry = otpExpiry;
      await user.save();
    }

    console.log(`[ClinicBook OTP Service] Generated OTP for +91-${cleanPhone}: ${demoOtp} (valid for 10 minutes)`);

    return res.json({
      success: true,
      message: `OTP sent successfully to +91-${cleanPhone}. (For quick testing/demo, use OTP: 123456)`,
      demoOtp: '123456'
    });
  } catch (error) {
    console.error('[Auth OTP] Error sending OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and log in / auto-register
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and 6-digit OTP are required.'
      });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Accept demo OTP '123456' or database OTP
    let user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      // Auto-create patient user with phone number
      user = await User.create({
        name: `User ${cleanPhone.slice(-4)}`,
        email: `patient_${cleanPhone}@clinicbook.in`,
        phone: cleanPhone,
        countryCode: '+91',
        password: 'Password@123',
        role: 'patient',
        isVerified: true
      });

      await Patient.create({
        user: user._id,
        address: { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' }
      });
    } else {
      if (otp !== '123456' && user.otpCode !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP code entered. For demo testing, please use 123456.'
        });
      }
    }

    const token = generateToken(user._id);

    let roleDetails = null;
    if (user.role === 'doctor') {
      roleDetails = await Doctor.findOne({ user: user._id });
    } else if (user.role === 'patient') {
      roleDetails = await Patient.findOne({ user: user._id });
    }

    return res.json({
      success: true,
      message: `OTP verified successfully. Welcome, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        countryCode: user.countryCode,
        role: user.role,
        roleDetails
      }
    });
  } catch (error) {
    console.error('[Auth Verify OTP] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying OTP. Please try again.'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let roleDetails = null;

    if (user.role === 'doctor') {
      roleDetails = await Doctor.findOne({ user: user._id });
    } else if (user.role === 'patient') {
      roleDetails = await Patient.findOne({ user: user._id });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        countryCode: user.countryCode,
        role: user.role,
        roleDetails
      }
    });
  } catch (error) {
    console.error('[Auth Me] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
