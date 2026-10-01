import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { getTodayDDMMYYYY, addDaysDDMMYYYY, parseDDMMYYYY, formatINR, approxForeignCurrency, getBrowserTimezone } from '../utils/format'

// Booking page - pick date, see live slot availability, choose patient (self/family),
// payment method. The backend assigns the token number and blocks conflicting slots.
const BookAppointment = () => {
  const { id } = useParams() // doctor id
  const navigate = useNavigate()
  const { user } = useAuth()

  const [doctor, setDoctor] = useState(null)
  const [date, setDate] = useState(getTodayDDMMYYYY())
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [bookingFor, setBookingFor] = useState('self')
  const [familyMembers, setFamilyMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [myTimezone, setMyTimezone] = useState('')

  // quick date chips: today and the next 6 days (DD-MM-YYYY)
  const dateOptions = Array.from({ length: 7 }, (_, i) => addDaysDDMMYYYY(i))

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/doctor/${id}`)
        setDoctor(res.data.doctor)
      } catch (err) {
        setError('Could not load doctor profile. Please go back and try again.')
        console.log('book page doctor load error:', err)
      }
    }
    load()
  }, [id])

  // load patient profile for family members list
  useEffect(() => {
    const loadFamily = async () => {
      if (!user || user.role !== 'patient') return
      try {
        const res = await api.get('/patient/me')
        setFamilyMembers(res.data.patient?.familyMembers || [])
      } catch (err) {
        console.log('family load error (ok if profile not created yet):', err.message)
      }
    }
    loadFamily()
  }, [user])

  // fetch slot availability whenever date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!doctor) return
      try {
        const res = await api.get(`/doctor/${id}/available-slots`, { params: { date } })
        setSlots(res.data.slots || [])
      } catch (err) {
        console.log('slot load error:', err)
        setSlots([])
      }
    }
    loadSlots()
    setSelectedSlot('') // reset selection when date changes
  }, [date, doctor, id])

  // detect user timezone once for the info line (international users)
  useEffect(() => {
    setMyTimezone(getBrowserTimezone())
  }, [])

  const selectedMemberObj = familyMembers.find((m) => String(m._id) === selectedMember)

  const handleBook = async (e) => {
    e.preventDefault()
    setError('')
    if (!selectedSlot) {
      setError('Please select an available time slot first.')
      return
    }
    if (bookingFor === 'family' && !selectedMember) {
      setError('Please choose which family member this appointment is for.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        doctorId: id,
        appointmentDate: date,
        timeSlot: selectedSlot,
        type: 'online',
        isFamilyMember: bookingFor === 'family',
        symptoms,
        paymentMethod,
        patientState: user?.roleDetails?.address?.state || 'Karnataka',
      }
      if (bookingFor === 'family' && selectedMemberObj) {
        payload.familyMemberDetails = {
          name: selectedMemberObj.name,
          relation: selectedMemberObj.relation,
          age: selectedMemberObj.age,
          gender: selectedMemberObj.gender,
        }
      }
      const res = await api.post('/appointment', payload)
      // success -> go to payment/details with the new appointment
      navigate(`/appointments/${res.data.appointment._id}`, {
        state: { justBooked: true, tokenNumber: res.data.tokenNumber },
      })
    } catch (err) {
      console.log('booking error:', err.response?.data)
      const msg = err.response?.data?.message || 'Booking failed. Please try again.'
      setError(msg)
      // refresh slots in case the conflict changed them
      try {
        const res = await api.get(`/doctor/${id}/available-slots`, { params: { date } })
        setSlots(res.data.slots || [])
      } catch (e2) { /* ignore */ }
    } finally {
      setSubmitting(false)
    }
  }

  if (error && !doctor) {
    return <div className="container mt-4"><div className="alert alert-danger">{error}</div></div>
  }
  if (!doctor) {
    return <div className="container mt-4 text-muted">Loading booking page...</div>
  }

  const availableCount = slots.filter((s) => s.isAvailable).length

  return (
    <div className="container mt-3">
      <Link to={`/doctors/${id}`} className="small">← Back to doctor profile</Link>
      <h4 className="mt-2">Book Appointment — {doctor.user?.name}</h4>
      <div className="text-muted small mb-3">
        {doctor.specialization} · {doctor.clinicAddress?.clinicName}, {doctor.clinicAddress?.city} ·
        Fee {formatINR(doctor.consultationFee)} <span className="text-muted">{approxForeignCurrency(doctor.consultationFee)}</span>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card card-clinic mb-3">
            <div className="card-body">
              <strong>1. Select date</strong>
              <div className="mt-2 mb-1 d-flex flex-wrap">
                {dateOptions.map((d) => {
                  const dt = parseDDMMYYYY(d)
                  const label = `${d} (${dt ? dt.toLocaleDateString('en-IN', { weekday: 'short' }) : ''})`
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`btn btn-sm me-1 mb-1 ${d === date ? 'btn-clinic' : 'btn-outline-secondary'}`}
                      onClick={() => setDate(d)}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                All dates in DD-MM-YYYY. Times are Indian Standard Time (IST, UTC+5:30).
                {myTimezone && myTimezone !== 'Asia/Kolkata' && myTimezone !== 'Asia/Calcutta' && (
                  <span>
                    {' '}Your local timezone: <strong>{myTimezone}</strong> — slot times still follow
                    the clinic's IST hours. (Manual override coming soon.)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="card card-clinic mb-3">
            <div className="card-body">
              <strong>2. Select time slot</strong>
              <span className="text-muted small ms-2">
                ({availableCount} of {slots.length} available)
              </span>
              <div className="mt-2 d-flex flex-wrap">
                {slots.length === 0 && <span className="text-muted">No slots configured for this date.</span>}
                {slots.map((s) => (
                  <button
                    key={s.slot}
                    type="button"
                    disabled={!s.isAvailable}
                    className={`btn btn-sm slot-btn ${
                      selectedSlot === s.slot ? 'btn-success' : s.isAvailable ? 'btn-outline-primary' : 'btn-outline-secondary slot-taken'
                    }`}
                    onClick={() => setSelectedSlot(s.slot)}
                    title={s.isAvailable ? 'Available' : `Booked (Token #${s.tokenNumber})`}
                  >
                    {s.slot}
                  </button>
                ))}
              </div>
              <div className="text-muted mt-2" style={{ fontSize: '0.78rem' }}>
                Struck-through slots are already booked for this date. Token numbers are given
                in booking order (like a clinic queue counter).
              </div>
            </div>
          </div>

          <form onSubmit={handleBook}>
            <div className="card card-clinic mb-3">
              <div className="card-body">
                <strong>3. Who is this appointment for?</strong>
                <div className="mt-2">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" id="forSelf"
                      checked={bookingFor === 'self'}
                      onChange={() => setBookingFor('self')} />
                    <label className="form-check-label" htmlFor="forSelf">
                      Myself ({user?.name})
                    </label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" id="forFamily"
                      checked={bookingFor === 'family'}
                      onChange={() => setBookingFor('family')} />
                    <label className="form-check-label" htmlFor="forFamily">
                      A family member
                    </label>
                  </div>
                </div>

                {bookingFor === 'family' && (
                  <div className="mt-2">
                    {familyMembers.length === 0 ? (
                      <div className="alert alert-light border small py-2">
                        You haven't added family members yet. Add them from{' '}
                        <Link to="/profile">your profile</Link>, or book as yourself for now.
                      </div>
                    ) : (
                      <select className="form-select" value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}>
                        <option value="">-- Select family member --</option>
                        {familyMembers.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.relation}, {m.age} yrs)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="mt-3">
                  <label className="form-label">Symptoms / reason for visit (optional)</label>
                  <textarea className="form-control" rows={2} value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g. fever and cold since 2 days" />
                </div>
              </div>
            </div>

            <div className="card card-clinic mb-3">
              <div className="card-body">
                <strong>4. Payment method</strong>
                <div className="row mt-2">
                  <div className="col-md-6">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" id="payUpi" name="pay"
                        checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} />
                      <label className="form-check-label" htmlFor="payUpi">UPI (GPay / PhonePe / Paytm)</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" id="payRzp" name="pay"
                        checked={paymentMethod === 'Razorpay'} onChange={() => setPaymentMethod('Razorpay')} />
                      <label className="form-check-label" htmlFor="payRzp">Razorpay (card / netbanking / wallet)</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" id="payCash" name="pay"
                        checked={paymentMethod === 'Cash at Clinic'} onChange={() => setPaymentMethod('Cash at Clinic')} />
                      <label className="form-check-label" htmlFor="payCash">Cash at Clinic (pay at reception)</label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" id="payStripe" name="pay"
                        checked={paymentMethod === 'Stripe'} onChange={() => setPaymentMethod('Stripe')} />
                      <label className="form-check-label" htmlFor="payStripe">
                        Stripe (international cards) <span className="text-muted small">— beta</span>
                      </label>
                    </div>
                    <div className="text-muted mt-2" style={{ fontSize: '0.78rem' }}>
                      You can also pay later from “My Appointments”. Cash payments are marked
                      pending until collected at the counter.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <button className="btn btn-clinic btn-lg mb-4" disabled={submitting}>
              {submitting ? 'Booking...' : `Confirm Booking — ${selectedSlot || 'no slot selected'}`}
            </button>
          </form>
        </div>

        {/* summary sidebar */}
        <div className="col-md-4">
          <div className="card card-clinic sticky-top" style={{ top: 70 }}>
            <div className="card-body">
              <h6>Booking summary</h6>
              <div className="small">
                <div className="d-flex justify-content-between"><span>Date</span><strong>{date}</strong></div>
                <div className="d-flex justify-content-between"><span>Time</span><strong>{selectedSlot || '—'}</strong></div>
                <div className="d-flex justify-content-between">
                  <span>Patient</span>
                  <strong>{bookingFor === 'family' ? (selectedMemberObj?.name || 'family member') : user?.name}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Consultation</span><strong>{formatINR(doctor.consultationFee)}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>GST (18%)</span><strong>{formatINR(Math.round(doctor.consultationFee * 0.18))}</strong>
                </div>
                <hr className="my-1" />
                <div className="d-flex justify-content-between">
                  <span>Total</span>
                  <strong className="text-fee">{formatINR(Math.round(doctor.consultationFee * 1.18))}</strong>
                </div>
              </div>
              <div className="text-muted mt-2" style={{ fontSize: '0.72rem' }}>
                GST splits into CGST+SGST (same state) or IGST (different state) on the invoice.
                Your token number is assigned on confirmation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookAppointment
