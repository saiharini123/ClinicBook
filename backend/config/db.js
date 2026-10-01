const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clinicbook_india';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[ClinicBook DB] MongoDB Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('[ClinicBook DB] Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
