import React, { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatINR, statusBadgeClass } from '../utils/format'
import RescheduleModal from '../components/RescheduleModal'

// Appointment details page - shows token, patient info, GST invoice, prescription
const AppointmentDetails = () => {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const [apt, setApt] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)

  // set after booking from navigation state (shows the success banner)
  const justBooked = location.state?.justBooked

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/appointment/${id}`)
        setApt(res.data.appointment)
      } catch (err) {
        console.log('appointment details load failed:', err.message)
        setNotFound(true)
      }
    }
    load()
  }, [id])

  if (notFound) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">Appointment not found.</div>
        <Link to="/dashboard" className="btn btn-clinic">Back to dashboard</Link>
      </div>
    )
  }

  if (!apt) {
    return <div className="container mt-4 text-muted">Loading appointment...</div>
  }

  const gst = apt.gstDetails || {}
  const canPay = apt.paymentStatus !== 'paid' && apt.status !== 'cancelled'

  return (
    <div className="container mt-3">
      {justBooked && (
        <div className="alert alert-success">
          🎉 <strong>Booking confirmed!</strong> Your token number is{' '}
          <strong>#{location.state.tokenNumber || apt.tokenNumber}</strong>. Save this page or
          check “My Appointments”.
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center">
        <h3>Appointment {apt.appointmentNumber}</h3>
        <span className={`badge ${statusBadgeClass(apt.status)} fs-6`}>{apt.status}</span>
      </div>

      <div className="row">
        <div className="col-md-7">
          {/* token card */}
          <div className="token-box mb-3 d-flex justify-content-between align-items-center">
            <div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>YOUR TOKEN NUMBER</div>
              <div className="token-number">#{apt.tokenNumber}</div>
              <div className="small">
                {apt.appointmentDate} at {apt.timeSlot} (IST) · {apt.type === 'walk-in' ? 'Walk-in' : 'Online booking'}
              </div>
            </div>
            <div className="text-end small">
              <div className={`badge ${statusBadgeClass(apt.status)}`}>{apt.status}</div>
              <div className="mt-1 text-muted">
                Show this token at reception.
              </div>
            </div>
          </div>

          <div className="card card-clinic mb-3">
            <div className="card-body">
              <h6>Doctor</h6>
              <div>
                <strong>Dr. {apt.doctor?.user?.name}</strong> — {apt.doctor?.specialization}
              </div>
              <div className="small text-muted">
                {apt.doctor?.degrees?.join(', ')} · Reg: {apt.doctor?.mciRegNumber}
              </div>
              <div className="small">
                📍 {apt.doctor?.clinicAddress?.clinicName}, {apt.doctor?.clinicAddress?.addressLine},
                {' '}{apt.doctor?.clinicAddress?.city}, {apt.doctor?.clinicAddress?.state} -{' '}
                {apt.doctor?.clinicAddress?.pincode}
              </div>

              <hr />
              <h6>Patient</h6>
              <div>
                {apt.patientName}{' '}
                {apt.isFamilyMember && (
                  <span className="badge bg-light text-dark border">
                    Family: {apt.familyMemberDetails?.relation}
                  </span>
                )}
              </div>
              <div className="small text-muted">Ph: {apt.countryCode || '+91'}-{apt.patientPhone}</div>
              <div className="small mt-1">
                <strong>Symptoms noted:</strong> {apt.symptoms || 'Not specified'}
              </div>

              {(apt.doctorNotes || apt.prescription) && (
                <>
                  <hr />
                  <h6>Doctor's notes / Prescription</h6>
                  <div className="small">{apt.doctorNotes}</div>
                  {apt.prescription && (
                    <div className="small mt-1 p-2 bg-light border rounded">{apt.prescription}</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-5">
          {/* GST invoice */}
          <div className="card card-clinic mb-3">
            <div className="invoice-header">
              <strong>Tax Invoice (GST)</strong>
              <div className="small">{gst.invoiceNumber || '—'}</div>
            </div>
            <div className="card-body">
              <div className="small mb-2">
                <div><strong>Seller:</strong> {apt.doctor?.clinicAddress?.clinicName}</div>
                <div>GSTIN: {gst.clinicGstin} · SAC: {gst.sacCode} (Healthcare services)</div>
                <div>Place of supply: {apt.doctor?.clinicAddress?.state}</div>
              </div>
              <table className="table table-sm invoice-table">
                <tbody>
                  <tr>
                    <td>Consultation fee</td>
                    <td className="text-end">{formatINR(gst.baseFee)}</td>
                  </tr>
                  {gst.cgst > 0 && (
                    <tr>
                      <td>CGST @ 9%</td>
                      <td className="text-end">{formatINR(gst.cgst)}</td>
                    </tr>
                  )}
                  {gst.sgst > 0 && (
                    <tr>
                      <td>SGST @ 9%</td>
                      <td className="text-end">{formatINR(gst.sgst)}</td>
                    </tr>
                  )}
                  {gst.igst > 0 && (
                    <tr>
                      <td>IGST @ 18%</td>
                      <td className="text-end">{formatINR(gst.igst)}</td>
                    </tr>
                  )}
                  <tr className="fw-bold">
                    <td>Total</td>
                    <td className="text-end">{formatINR(gst.totalFee)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="small">
                Payment status:{' '}
                <span className={apt.paymentStatus === 'paid' ? 'text-success' : 'text-warning'}>
                  <strong>{apt.paymentStatus}</strong>
                </span>{' '}
                via {apt.paymentMethod}
                {apt.paymentTransactionId && (
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Txn: {apt.paymentTransactionId}
                  </div>
                )}
              </div>
              {canPay && (
                <Link to={`/appointments/${apt._id}/pay`} className="btn btn-clinic w-100 mt-2">
                  Pay {formatINR(gst.totalFee)} Now
                </Link>
              )}
              <div className="text-muted mt-2" style={{ fontSize: '0.7rem' }}>
                This is a computer generated invoice under CGST/SGST Act, 2017. Subject to
                Bengaluru jurisdiction.
              </div>
            </div>
          </div>

          {user?.role === 'patient' && apt.status === 'scheduled' && (
            <div className="card card-clinic">
              <div className="card-body">
                <h6>Plans changed?</h6>
                <p className="small text-muted mb-2">
                  Prepone or postpone to any open slot — no charges. Or cancel to release
                  the slot for other patients.
                </p>
                <button className="btn btn-clinic btn-sm me-2"
                  onClick={() => setShowReschedule(true)}>
                  Reschedule
                </button>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={async () => {
                    if (!window.confirm('Cancel this appointment?')) return
                    try {
                      await api.delete(`/appointment/${apt._id}`)
                      window.location.reload() // simple approach, fine for now
                    } catch (err) {
                      alert('Could not cancel: ' + (err.response?.data?.message || 'server error'))
                    }
                  }}
                >
                  Cancel Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showReschedule && (
        <RescheduleModal
          appointment={apt}
          onClose={() => setShowReschedule(false)}
          onDone={() => {
            setShowReschedule(false)
            window.location.reload() // simplest way to refresh the details view
          }}
        />
      )}
    </div>
  )
}

export default AppointmentDetails
