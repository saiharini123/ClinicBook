import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { formatINR, approxForeignCurrency } from '../utils/format'

// Payment page - UPI (GPay/PhonePe/Paytm), Razorpay, Cash at Clinic, Stripe for intl
const PaymentPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [apt, setApt] = useState(null)
  const [method, setMethod] = useState('UPI')
  const [upiApp, setUpiApp] = useState('Google Pay')
  const [upiId, setUpiId] = useState('')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('') // shown inline instead of alert() dialogs

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/appointment/${id}`)
        setApt(res.data.appointment)
      } catch (err) {
        console.log('payment page load error:', err.message)
      }
    }
    load()
  }, [id])

  const gst = apt?.gstDetails || {}
  const total = gst.totalFee || 0

  const handlePay = async () => {
    setError('')
    // quick client validation per method
    if (method === 'Razorpay' || method === 'Stripe') {
      if (!card.number || card.number.replace(/\s/g, '').length < 12) {
        setError('Please enter a valid card number.')
        return
      }
      if (!card.name) {
        setError('Please enter the name on card.')
        return
      }
    }
    if (method === 'UPI' && upiId && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
      setError('UPI ID looks incorrect. Format is like name@okhdfcbank or name@paytm.')
      return
    }

    setBusy(true)
    try {
      // backend simulates the gateway response. real integration would open
      // razorpay checkout.js / stripe elements here instead
      const res = await api.post('/payment/simulate', {
        appointmentId: id,
        paymentMethod: method,
        upiId,
        currency: method === 'Stripe' ? 'USD' : 'INR',
        internationalCardDetails: method === 'Stripe' ? card : undefined,
      })
      setSuccessMsg(res.data.message)
      // brief pause so the user sees the confirmation, then go to appointment details
      setTimeout(() => navigate(`/appointments/${id}`), 1500)
    } catch (err) {
      console.log('payment error:', err)
      setError(err.response?.data?.message || 'Payment failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!apt) {
    return <div className="container mt-4 text-muted">Loading payment page...</div>
  }

  return (
    <div className="container mt-3">
      <div className="row justify-content-center">
        <div className="col-md-7">
          <h3>Payment</h3>
          <p className="text-muted small">
            Appointment {apt.appointmentNumber} · Token #{apt.tokenNumber} ·{' '}
            {apt.appointmentDate} at {apt.timeSlot}
          </p>

          <div className="card card-clinic mb-3">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div>Consultation with <strong>Dr. {apt.doctor?.user?.name}</strong></div>
                <div className="small text-muted">
                  Incl. GST {formatINR(gst.cgst + gst.sgst + gst.igst)} · Invoice {gst.invoiceNumber}
                </div>
              </div>
              <div className="text-end">
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }} className="text-fee">
                  {formatINR(total)}
                </div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  {approxForeignCurrency(total)}
                </div>
              </div>
            </div>
          </div>

          <div className="card card-clinic mb-3">
            <div className="card-body">
              <h6>Select payment method</h6>

              <div className="form-check">
                <input className="form-check-input" type="radio" id="mUpi" name="pm"
                  checked={method === 'UPI'} onChange={() => setMethod('UPI')} />
                <label className="form-check-label" htmlFor="mUpi">
                  <strong>UPI</strong> — Google Pay, PhonePe, Paytm
                </label>
              </div>
              {method === 'UPI' && (
                <div className="ms-4 my-2">
                  <div className="btn-group btn-group-sm mb-2">
                    {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                      <button key={app} type="button"
                        className={`btn ${upiApp === app ? 'btn-clinic' : 'btn-outline-secondary'}`}
                        onClick={() => setUpiApp(app)}>
                        {app}
                      </button>
                    ))}
                  </div>
                  <input className="form-control form-control-sm" placeholder="Your UPI ID (optional) e.g. rajesh@okhdfcbank"
                    value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                  <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                    You'll get a collect request on your {upiApp} app. (Simulated in this demo.)
                  </div>
                </div>
              )}

              <div className="form-check">
                <input className="form-check-input" type="radio" id="mRzp" name="pm"
                  checked={method === 'Razorpay'} onChange={() => setMethod('Razorpay')} />
                <label className="form-check-label" htmlFor="mRzp">
                  <strong>Razorpay</strong> — cards / netbanking / wallets
                </label>
              </div>
              {method === 'Razorpay' && (
                <div className="ms-4 my-2 row g-2">
                  <div className="col-12">
                    <input className="form-control form-control-sm" placeholder="Card number"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <input className="form-control form-control-sm" placeholder="Name on card"
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <input className="form-control form-control-sm" placeholder="MM/YY"
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <input className="form-control form-control-sm" placeholder="CVV"
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="form-check">
                <input className="form-check-input" type="radio" id="mCash" name="pm"
                  checked={method === 'Cash at Clinic'} onChange={() => setMethod('Cash at Clinic')} />
                <label className="form-check-label" htmlFor="mCash">
                  <strong>Cash at Clinic</strong> — pay at reception on visit day
                </label>
              </div>

              <div className="form-check">
                <input className="form-check-input" type="radio" id="mStripe" name="pm"
                  checked={method === 'Stripe'} onChange={() => setMethod('Stripe')} />
                <label className="form-check-label" htmlFor="mStripe">
                  <strong>Stripe</strong> — international cards (USD/EUR/GBP/AED)
                </label>
              </div>
              {method === 'Stripe' && (
                <div className="ms-4 my-2 alert alert-light border small py-2">
                  Stripe integration is in beta. You will be charged an approximate equivalent
                  of {formatINR(total)} ({approxForeignCurrency(total)}). Card form is the same
                  as Razorpay above — use the Razorpay card fields for now.
                </div>
              )}

              {successMsg && <div className="alert alert-success py-2 mt-2">✅ {successMsg}</div>}
              {error && <div className="alert alert-danger py-2 mt-2">{error}</div>}

              <button className="btn btn-clinic w-100 mt-2" onClick={handlePay} disabled={busy}>
                {busy ? 'Processing...' : `Pay ${formatINR(total)}`}
              </button>
              <div className="text-center mt-2">
                <Link to={`/appointments/${id}`} className="small">Pay later — back to appointment</Link>
              </div>
            </div>
          </div>

          <div className="text-muted text-center" style={{ fontSize: '0.72rem' }}>
            Payments are simulated in this demo build. No real money moves. GST invoice is
            generated per booking under the clinic GSTIN {gst.clinicGstin}.
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
