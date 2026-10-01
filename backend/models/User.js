const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please provide a valid mobile number'],
      trim: true
    },
    countryCode: {
      type: String,
      default: '+91'
    },
    password: {
      type: String,
      required: [true, 'Please enter a secure password'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient'
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    otpCode: {
      type: String,
      default: null
    },
    otpExpiry: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Match user-entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
