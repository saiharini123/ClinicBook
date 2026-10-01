// One-off utility: reset today's seed appointment statuses (used while testing the queue flow)
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Appointment = require('../models/Appointment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clinicbook_india';

(async () => {
  await mongoose.connect(MONGO_URI);
  const r1 = await Appointment.updateMany({ tokenNumber: { $in: [2, 3] } }, { $set: { status: 'scheduled' } });
  const r2 = await Appointment.updateMany({ tokenNumber: 1 }, { $set: { status: 'completed' } });
  console.log('reset done:', r1.modifiedCount, 'scheduled,', r2.modifiedCount, 'completed');
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
