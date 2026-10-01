import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useLang } from '../context/LangContext'
import { statusBadgeClass, parseDDMMYYYY, getTodayDDMMYYYY } from '../utils/format'
import RescheduleModal from '../components/RescheduleModal'

// Booking history for the logged in patient
const MyAppointments = () => {
  const { t } = useLang()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const [msg, setMsg] = useState('')
  const [rescheduleFor, setRescheduleFor] = useState(null) // appointment being rescheduled

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/appointment')
      setAppointments(res.data.appointments || [])
    } catch (err) {
      console.log('my appointments load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const today = getTodayDDMMYYYY()

  const isUpcoming = (a) =>
    (a.status === 'scheduled' || a.status === 'in-consultation') &&
    (parseDDMMYYYY(a.appointmentDate) >= parseDDMMYYYY(today))

  const upcoming = appointments.filter(isUpcoming)
  const past = appointments.filter((a) => !isUpcoming(a))

  const cancelAppointment = async (id) => {
    if (!window.confirm('Cancel this appointment? The slot will be released for other patients.')) return
    try {
      await api.delete(`/appointment/${id}`)
      setMsg('Appointment cancelled successfully.')
      load()
    } catch (err) {
      console.log('cancel error:', err)
      setMsg(err.response?.data?.message || 'Could not cancel. Please try again.')
    }
  }

  const renderRow = (a) => (
    <div className="card card-clinic mb-2" key={a._id}>
      <div className="card-body py-2">
        <div className="row align-items-center">
          <div className="col-md-2 text-center border-end">
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>TOKEN</div>
            <div style={{ fontWeight: 700, fontSize: '1.4rem', color: '#1a5f9e' }}>
              #{a.tokenNumber}
            </div>
          </div>
          <div className="col-md-5">
            <strong>{a.doctor?.user?.name?.replace(/^Dr\.?\s*/i, 'Dr. ')}</strong>{' '}
            <span className="text-muted small">({a.doctor?.specialization})</span>
            <div className="small text-muted">
              {a.doctor?.clinicAddress?.clinicName}, {a.doctor?.clinicAddress?.city}
            </div>
            <div className="small">
              {a.appointmentDate} at {a.timeSlot} IST
              {a.isFamilyMember && a.familyMemberDetails?.name && (
                <span className="badge bg-light text-dark border ms-1">
                  for {a.familyMemberDetails.name} ({a.familyMemberDetails.relation})
                </span>
              )}
            </div>
          </div>
          <div className="col-md-3">
            <span className={`badge ${statusBadgeClass(a.status)}`}>{a.status}</span>{' '}
            <span className={`badge ${a.type === 'walk-in' ? 'badge-walkin' : 'badge-appointment'}`}>
              {a.type}
            </span>
            <div className="small text-muted mt-1">
              Fee: {a.gstDetails?.totalFee ? formatRupees(a.gstDetails.totalFee) : '—'} ·{' '}
              <span className={a.paymentStatus === 'paid' ? 'text-success' : 'text-warning'}>
                {a.paymentStatus}
              </span>{' '}
              ({a.paymentMethod})
            </div>
          </div>
          <div className="col-md-2 text-end">
            <Link to={`/appointments/${a._id}`} className="btn btn-sm btn-outline-primary mb-1">
              {t('viewDetails')}
            </Link>
            {a.paymentStatus !== 'paid' && a.status !== 'cancelled' && (
              <div>
                <Link to={`/appointments/${a._id}/pay`} className="btn btn-sm btn-clinic">
                  {t('payNow')}
                </Link>
              </div>
            )}
            {(a.status === 'scheduled') && (
              <div>
                <button className="btn btn-sm btn-outline-primary mt-1"
                  onClick={() => setRescheduleFor(a)}>
                  Reschedule
                </button>
                <button className="btn btn-sm btn-outline-danger mt-1"
                  onClick={() => cancelAppointment(a._id)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // tiny local helper (kept here instead of utils, used in 2 places only)
  const formatRupees = (n) => '₹' + Number(n).toLocaleString('en-IN')

  return (
    <div className="container mt-3">
      <div className="d-flex justify-content-between align-items-center">
        <h3>{t('myAppointments')}</h3>
        <Link to="/doctors" className="btn btn-clinic btn-sm">+ New booking</Link>
      </div>

      {msg && <div className="alert alert-info py-2">{msg}</div>}

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setTab('upcoming')}>
            {t('upcoming')} ({upcoming.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'history' ? 'active' : ''}`}
            onClick={() => setTab('history')}>
            {t('completed')} / Past ({past.length})
          </button>
        </li>
      </ul>

      {loading && <p className="text-muted">Loading your bookings...</p>}

      {!loading && tab === 'upcoming' && (
        upcoming.length === 0
          ? <div className="alert alert-info">No upcoming appointments. <Link to="/doctors">Book one now</Link>.</div>
          : upcoming.map(renderRow)
      )}
      {!loading && tab === 'history' && (
        past.length === 0
          ? <div className="alert alert-light border">No past appointments yet.</div>
          : past.map(renderRow)
      )}

      {/* reschedule modal (prepone / postpone) */}
      {rescheduleFor && (
        <RescheduleModal
          appointment={rescheduleFor}
          onClose={() => setRescheduleFor(null)}
          onDone={(res) => {
            setRescheduleFor(null)
            setMsg(res.message)
            load()
          }}
        />
      )}
    </div>
  )
}

export default MyAppointments
