const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for developer debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString('en-IN')}] ${req.method} ${req.url}`);
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Healthcare Clinic Booking System (ClinicBook India)',
    timezone: 'Asia/Kolkata (IST, UTC+5:30)',
    time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/appointment', require('./routes/appointmentRoutes'));
app.use('/api/booking', require('./routes/appointmentRoutes')); // Alias for booking
app.use('/api/patient', require('./routes/patientRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

// 404 Handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[ClinicBook Server Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// NOTE: default port is 5050 (5000 is often taken by other dev apps on dev machines)
const PORT = process.env.PORT && Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 5050;

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🏥 ClinicBook India API Server running on port ${PORT}`);
  console.log(`🇮🇳 Indian Default Timezone: IST (UTC+5:30)`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
  console.log(`========================================================`);
});
