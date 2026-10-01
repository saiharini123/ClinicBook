import React, { useEffect, useState } from 'react'
import api from '../api/client'
import { addDaysDDMMYYYY, parseDDMMYYYY, format12Hour } from '../utils/format'

// Reschedule modal - prepone or postpone an appointment.
// Shows the doctor's real slot availability for each date and validates
// everything server-side too (conflicts, leave days, working days).
const RescheduleModal = ({ appointment, onClose, onDone }) => {
  const [doctor, setDoctor] = useState(null)
  const [date, setDate] = useState(appointment.appointmentDate)
  const [slots, setSlots] = useState([])
  const [slot, setSlot] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  // next 14 days as date chips
  const dateOptions = Array.from({ length: 14 }, (_, i) => addDaysDDMMYYYY(i))

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/doctor/${appointment.doctor._id || appointment.doctor}`)
        setDoctor(res.data.doctor)
      } catch (err) {
        console.log('reschedule modal doctor load failed:', err.message)
        setError('Could not load doctor availability.')
      }
    }
    load()
  }, [appointment])

  // load slot availability whenever date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!doctor) return
      try {
        const res = await api.get(`/doctor/${doctor._id}/available-slots`, { params: { date } })
        setSlots(res.data.slots || [])
      } catch (err) {
        console.log('reschedule slots load failed:', err.message)
        setSlots([])
      }
    }
    loadSlots()
    setSlot('')
  }, [date, doctor])

  const currentSlot = appointment.timeSlot
  const isSameDate = date === appointment.appointmentDate

  const submit = async () => {
    setError('')
    setInfo('')
    if (!slot) {
      setError('Please choose a new time slot.')
      return
    }
    if (isSameDate && slot === currentSlot) {
      setError('That is the current slot already. Pick a different date or time.')
      return
    }
    setBusy(true)
    try {
      const res = await api.put(`/appointment/${appointment._id}/reschedule`, {
        newDate: date,
        newTimeSlot: slot,
      })
      setInfo(res.data.message)
      setTimeout(() => onDone && onDone(res.data), 1200)
    } catch (err) {
      console.log('reschedule error:', err.response?.data)
      setError(err.response?.data?.message || 'Reschedule failed. Please try another slot.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.4)' }} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header py-2">
            <h6 className="modal-title">
              Reschedule Appointment {appointment.appointmentNumber} — currently {appointment.appointmentDate} at {currentSlot}
            </h6>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {info && <div className="alert alert-success py-2">{info}</div>}

            <strong className="small">1. Pick a new date</strong>
            <div className="d-flex flex-wrap mt-1 mb-3">
              {dateOptions.map((d) => {
                const dt = parseDDMMYYYY(d)
                const label = `${d} (${dt ? dt.toLocaleDateString('en-IN', { weekday: 'short' }) : ''})`
                return (
                  <button key={d} type="button"
                    className={`btn btn-sm me-1 mb-1 ${d === date ? 'btn-clinic' : 'btn-outline-secondary'}`}
                    onClick={() => setDate(d)}>
                    {label}
                  </button>
                )
              })}
            </div>

            <strong className="small">2. Pick a new time slot (IST, 12-hour)</strong>
            {!isSameDate && (
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                Prepone (earlier date) or postpone (later date) — both allowed. Your token
                number stays the same if the date doesn't change; on a new date you get the
                next token of that day.
              </div>
            )}
            <div className="d-flex flex-wrap mt-1">
              {slots.map((s) => {
                const isCurrent = isSameDate && s.slot === currentSlot
                const disabled = !s.isAvailable || isCurrent
                return (
                  <button key={s.slot} type="button" disabled={disabled}
                    className={`btn btn-sm slot-btn ${
                      slot === s.slot ? 'btn-success' : disabled ? 'btn-outline-secondary slot-taken' : 'btn-outline-primary'
                    }`}
                    onClick={() => setSlot(s.slot)}
                    title={s.isBlocked ? s.reason || 'Doctor unavailable' : isCurrent ? 'Current slot' : s.isAvailable ? 'Available' : 'Booked'}>
                    {s.slot}
                  </button>
                )
              })}
            </div>
            <div className="text-muted mt-2" style={{ fontSize: '0.72rem' }}>
              Struck-through slots are booked or the doctor is unavailable that day.
              {' '}Working days: {(doctor?.availableDays || []).join(', ')}.
            </div>
          </div>
          <div className="modal-footer py-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button className="btn btn-sm btn-clinic" onClick={submit} disabled={busy || !!info}>
              {busy ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RescheduleModal
