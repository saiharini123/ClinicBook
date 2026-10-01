# ClinicBook India 🏥

Healthcare Clinic Booking System (MERN) built for Indian clinics — token-based
appointments, slot conflict validation, GST invoicing, UPI/Razorpay/cash payments,
family bookings, walk-in queue management and 108 emergency integration.

## Quick start

```bash
npm run install:all     # installs backend + frontend deps
npm run seed            # seeds demo data (doctors, patients, appointments)
npm start               # backend on http://localhost:5050  (MongoDB must be running)
npm run start:frontend  # frontend on http://localhost:5173 (proxies /api to :5050)
```

## Demo accounts (after seeding)

| Role    | Email / Phone                        | Password    |
|---------|--------------------------------------|-------------|
| Patient | rajesh.sharma@example.com / 9876501234 | Patient@123 |
| Doctor  | dr.vikram@clinicbook.in / 9845012345   | Doctor@123  |
| Admin   | admin@clinicbook.in / 9876543210       | Admin@123   |

OTP login: any 10-digit Indian number, OTP is `123456` (demo mode).

## Feature map

- **Booking**: slot conflict validation (409 on double booking), instant token
  numbers, DD-MM-YYYY dates, 12-hour AM/PM slots, IST timezone
- **Payments**: UPI (GPay/PhonePe/Paytm), Razorpay, cash-at-clinic tracking,
  Stripe placeholder for international users; GST invoice per booking
  (CGST/SGST vs IGST by state)
- **India-specific**: +91 default with country selector, state/city dropdowns,
  optional masked Aadhaar, MCI/NMC reg numbers, AYUSH specializations,
  7-language toggle, 108 ambulance + pincode hospital locator
- **Queue**: doctor dashboard with call-next-token, walk-in registration,
  cash collection marking, prescriptions

Backend port can be overridden with the `PORT` env var. `MONGO_URI` defaults to
`mongodb://127.0.0.1:27017/clinicbook_india`.
