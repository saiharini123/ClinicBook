const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');

// @route   POST /api/payment/simulate
// @desc    Simulate payments for UPI (GPay, PhonePe, Paytm), Razorpay, Cash at Clinic, or International Stripe
router.post('/simulate', protect, async (req, res) => {
  try {
    const { appointmentId, paymentMethod, upiId, currency = 'INR', internationalCardDetails } = req.body;

    if (!appointmentId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID and Payment Method are required.'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    let transactionId = '';
    let status = 'paid';

    if (paymentMethod === 'Cash at Clinic') {
      // For Cash payments, appointment remains valid but paymentStatus is tracked as 'pending' until collected at counter
      appointment.paymentMethod = 'Cash at Clinic';
      appointment.paymentStatus = 'pending';
      appointment.paymentTransactionId = `CASH-COUNTER-${Date.now().toString().slice(-6)}`;
      await appointment.save();

      return res.json({
        success: true,
        message: 'Cash payment choice recorded. Please pay the consultation fee at the clinic reception counter on your visit date.',
        paymentStatus: 'pending',
        appointment
      });
    }

    if (['UPI', 'Google Pay', 'PhonePe', 'Paytm'].includes(paymentMethod)) {
      transactionId = `UPI-RR-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      appointment.paymentMethod = paymentMethod;
      appointment.paymentStatus = 'paid';
      appointment.paymentTransactionId = transactionId;
      await appointment.save();

      return res.json({
        success: true,
        message: `UPI payment of ₹${appointment.gstDetails.totalFee} received successfully via ${paymentMethod}.`,
        transactionId,
        paymentStatus: 'paid',
        appointment
      });
    }

    if (paymentMethod === 'Razorpay') {
      const razorpayPaymentId = `pay_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
      appointment.paymentMethod = 'Razorpay';
      appointment.paymentStatus = 'paid';
      appointment.paymentTransactionId = razorpayPaymentId;
      await appointment.save();

      return res.json({
        success: true,
        message: `Razorpay payment verified successfully. Payment ID: ${razorpayPaymentId}`,
        transactionId: razorpayPaymentId,
        paymentStatus: 'paid',
        appointment
      });
    }

    if (paymentMethod === 'Stripe') {
      const stripeChargeId = `ch_mock_${Date.now().toString(36)}`;
      appointment.paymentMethod = 'Stripe';
      appointment.paymentStatus = 'paid';
      appointment.paymentTransactionId = stripeChargeId;
      await appointment.save();

      return res.json({
        success: true,
        message: `International card processed via Stripe. Charge ID: ${stripeChargeId}`,
        transactionId: stripeChargeId,
        paymentStatus: 'paid',
        appointment
      });
    }

    return res.status(400).json({ success: false, message: 'Unsupported payment method.' });
  } catch (error) {
    console.error('[Payment API] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing payment.' });
  }
});

// @route   PUT /api/payment/mark-cash-collected/:appointmentId
// @desc    Doctor or Admin marks cash as collected at the clinic counter
router.put('/mark-cash-collected/:appointmentId', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    appointment.paymentStatus = 'paid';
    appointment.paymentTransactionId = `CASH-RECVD-${Date.now().toString().slice(-6)}`;
    await appointment.save();

    return res.json({
      success: true,
      message: `Cash payment of ₹${appointment.gstDetails.totalFee} marked as collected at clinic reception counter.`,
      appointment
    });
  } catch (error) {
    console.error('[Cash Collected API] Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating payment.' });
  }
});

module.exports = router;
