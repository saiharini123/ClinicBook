import React, { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { getTodayDDMMYYYY, addDaysDDMMYYYY, statusBadgeClass } from '../utils/format'

// Queue manager for doctors - call next token, mark in-consultation/completed,
// register walk-ins, collect cash, write prescriptions.
const DoctorQueue = () => {
  const { user } = useAuth()
  const [date, setDate] = useState(getTodayDDMMYYYY())
  const [doctor, setDoctor] = useState(null)
  const [queue, setQueue] = useState([])
  const [walkInName, setWalkInName] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInSlot, setWalkInSlot] = useState('Walk-in')
  const [msg, setMsg] = useState('')

  // leave / availability marking
  const [leaveDate, setLeaveDate] = useState('')
  const [leaveFullDay, setLeaveFullDay] = useState(true)
  const [leaveSlots, setLeaveSlots] = useState([])
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveMsg, setLeaveMsg] = useState(null) // { message, autoRescheduled }

  const [prescriptionFor, setPrescriptionFor] = useState(null) // appointment id being edited
  const [prescriptionText, setPrescriptionText] = useState('')
  const [notesText, setNotesText] = useState('')

  // find my doctor profile
  useEffect(() => {
    const loadDoctor = async () => {
      try {
        // doctorRoutes returns list; we match by user id client-side (simple approach)
        const res = await api.get('/doctor')
        const mine = (res.data.doctors || []).find(
          (d) => d.user && (d.user._id === user.id || d.user._id === user._id)
        )
        if (mine) setDoctor(mine)
        else setMsg('Doctor profile not found for this account.')
      } catch (err) {
        console.log('doctor profile load failed:', err.message)
        setMsg('Could not load doctor profile.')
      }
    }
    loadDoctor()
  }, [])

  const loadQueue = async () => {
    if (!doctor) return
    try {
      const res = await api.get(`/appointment/queue-status/${doctor._id}`, { params: { date } })
      setQueue(res.data.queue || [])
    } catch (err) {
      console.log('queue load failed:', err.message)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [doctor, date])

  const updateStatus = async (aptId, status) => {
    try {
      await api.put(`/appointment/${aptId}`, { status })
      loadQueue()
    } catch (err) {
      console.log('status update failed:', err)
      setMsg('Could not update status.')
    }
  }

  // call next waiting token: completes whoever is currently in-consultation first,
  // then moves the next scheduled token into consultation (like a real clinic counter)
  const callNext = async () => {
    const next = queue.find((q) => q.status === 'scheduled')
    if (!next) {
      setMsg('No more waiting patients. All tokens served 🎉')
      return
    }
    try {
      const current = queue.find((q) => q.status === 'in-consultation')
      if (current) {
        await api.put(`/appointment/${current.id}`, { status: 'completed' })
      }
      await api.put(`/appointment/${next.id}`, { status: 'in-consultation' })
      loadQueue()
    } catch (err) {
      console.log('call next failed:', err)
      setMsg('Could not call next token.')
    }
  }

  const markCashCollected = async (aptId) => {
    try {
      const res = await api.put(`/payment/mark-cash-collected/${aptId}`)
      setMsg(res.data.message)
      loadQueue()
    } catch (err) {
      console.log('cash mark failed:', err)
      setMsg('Could not mark cash collected.')
    }
  }

  const savePrescription = async (aptId) => {
    try {
      await api.put(`/appointment/${aptId}`, {
        doctorNotes: notesText,
        prescription: prescriptionText,
      })
      setMsg('Prescription saved.')
      setPrescriptionFor(null)
      setPrescriptionText('')
      setNotesText('')
      loadQueue()
    } catch (err) {
      console.log('prescription save failed:', err)
      setMsg('Could not save prescription.')
    }
  }

  // mark unavailable (leave) — backend auto-reschedules affected patients
  const markLeave = async (e) => {
    e.preventDefault()
    setLeaveMsg(null)
    if (!/^\d{2}-\d{2}-\d{4}$/.test(leaveDate)) {
      setLeaveMsg({ message: 'Please enter the leave date in DD-MM-YYYY format.', autoRescheduled: [] })
      return
    }
    if (!leaveFullDay && leaveSlots.length === 0) {
      setLeaveMsg({ message: 'Select at least one slot, or tick "entire day".', autoRescheduled: [] })
      return
    }
    try {
      const res = await api.post(`/doctor/${doctor._id}/unavailable`, {
        date: leaveDate,
        timeSlots: leaveFullDay ? [] : leaveSlots,
        reason: leaveReason || 'Doctor unavailable',
      })
      setLeaveMsg(res.data)
      setLeaveSlots([])
      setLeaveReason('')
      loadQueue() // affected patients may have left today's queue
    } catch (err) {
      console.log('mark leave error:', err.response?.data)
      setLeaveMsg({ message: err.response?.data?.message || 'Could not mark leave.', autoRescheduled: [] })
    }
  }

  const registerWalkIn = async (e) => {
    e.preventDefault()
    setMsg('')
    if (!walkInName.trim()) {
      setMsg('Please enter walk-in patient name.')
      return
    }
    try {
      // walk-ins are appointments of type walk-in. use next free slot from doctor config
      // fallback: first slot of the day. token assigned by backend in booking order.
      const res = await api.post('/appointment', {
        doctorId: doctor._id,
        appointmentDate: date,
        timeSlot: walkInSlot,
        type: 'walk-in',
        patientName: walkInName,
        patientPhone: walkInPhone,
        isFamilyMember: false,
        paymentMethod: 'Cash at Clinic',
      })
      setMsg(`Walk-in registered. Token #${res.data.tokenNumber} for ${walkInName}.`)
      setWalkInName('')
      setWalkInPhone('')
      loadQueue()
    } catch (err) {
      console.log('walkin register error:', err.response?.data)
      setMsg(err.response?.data?.message || 'Walk-in registration failed (slot may be full).')
    }
  }

  const serving = queue.find((q) => q.status === 'in-consultation')
  const waiting = queue.filter((q) => q.status === 'scheduled')
  const done = queue.filter((q) => q.status === 'completed' || q.status === 'cancelled')

  return (
    <div className="container mt-3">
      <h3>Queue Manager</h3>
      <p className="text-muted small">
        Token calling for {doctor?.clinicAddress?.clinicName || 'your clinic'} · Date:{' '}
        <strong>{date}</strong> (DD-MM-YYYY, IST)
      </p>

      {/* date switcher */}
      <div className="mb-3">
        {[
          ['Today', getTodayDDMMYYYY()],
          ['Tomorrow', addDaysDDMMYYYY(1)],
        ].map(([label, d]) => (
          <button key={d} className={`btn btn-sm me-1 ${date === d ? 'btn-clinic' : 'btn-outline-secondary'}`}
            onClick={() => setDate(d)}>
            {label} ({d})
          </button>
        ))}
        <input type="text" className="form-control form-control-sm d-inline-block ms-2"
          style={{ width: 120 }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="DD-MM-YYYY" />
      </div>

      {msg && <div className="alert alert-info py-2">{msg}</div>}

      <div className="row">
        <div className="col-md-8">
          {/* now serving banner */}
          <div className="token-box mb-3 d-flex justify-content-between align-items-center">
            <div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>NOW SERVING</div>
              <div className="token-number">
                {serving ? `#${serving.tokenNumber}` : '—'}
              </div>
              {serving && <div className="small">{serving.patientName} · {serving.timeSlot}</div>}
            </div>
            <div className="text-end">
              <button className="btn btn-clinic" onClick={callNext} disabled={!doctor}>
                Call Next Token →
              </button>
              {serving && (
                <div className="mt-2">
                  <button className="btn btn-sm btn-outline-success"
                    onClick={() => updateStatus(serving.id, 'completed')}>
                    Mark {serving.tokenNumber} completed
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* waiting list */}
          <h5>Waiting ({waiting.length})</h5>
          {waiting.length === 0 && <p className="text-muted">Nobody waiting right now.</p>}
          {waiting.map((q) => (
            <div className="card card-clinic mb-2" key={q.id}>
              <div className="card-body py-2 d-flex justify-content-between align-items-center">
                <div>
                  <strong>#{q.tokenNumber}</strong> · {q.patientName}
                  <span className="text-muted small"> · {q.timeSlot} · {q.type}</span>
                </div>
                <div>
                  <button className="btn btn-sm btn-outline-primary me-1"
                    onClick={() => updateStatus(q.id, 'in-consultation')}>
                    Start
                  </button>
                  <button className="btn btn-sm btn-outline-danger"
                    onClick={() => updateStatus(q.id, 'cancelled')}>
                    No-show
                  </button>
                </div>
              </div>
            </div>
          ))}

          <h5 className="mt-3">Served / Cancelled ({done.length})</h5>
          {done.length === 0 && <p className="text-muted small">Nothing here yet.</p>}
          {done.map((q) => (
            <div className="card card-clinic mb-2" key={q.id}>
              <div className="card-body py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>#{q.tokenNumber}</strong> · {q.patientName}
                    <span className="text-muted small"> · {q.timeSlot}</span>{' '}
                    <span className={`badge ${statusBadgeClass(q.status)}`}>{q.status}</span>
                  </div>
                  <div>
                    {prescriptionFor === q.id ? (
                      <button className="btn btn-sm btn-secondary"
                        onClick={() => setPrescriptionFor(null)}>Close</button>
                    ) : (
                      <button className="btn btn-sm btn-outline-secondary"
                        onClick={() => { setPrescriptionFor(q.id); setPrescriptionText(''); setNotesText('') }}>
                        Add prescription
                      </button>
                    )}
                  </div>
                </div>
                {prescriptionFor === q.id && (
                  <div className="mt-2">
                    <input className="form-control form-control-sm mb-1" placeholder="Doctor notes"
                      value={notesText} onChange={(e) => setNotesText(e.target.value)} />
                    <textarea className="form-control form-control-sm mb-1" rows={2}
                      placeholder="Prescription (medicines, dosage)"
                      value={prescriptionText}
                      onChange={(e) => setPrescriptionText(e.target.value)} />
                    <button className="btn btn-sm btn-clinic"
                      onClick={() => savePrescription(q.id)}>Save</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* walk-in registration panel */}
        <div className="col-md-4">
          <div className="card card-clinic">
            <div className="card-body">
              <h6>Register Walk-in Patient</h6>
              <p className="text-muted small">
                For patients who come directly to the clinic without an online booking. They
                join the same token queue.
              </p>
              <form onSubmit={registerWalkIn}>
                <div className="mb-2">
                  <label className="form-label small mb-1">Patient name *</label>
                  <input className="form-control form-control-sm" value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)} />
                </div>
                <div className="mb-2">
                  <label className="form-label small mb-1">Phone (optional)</label>
                  <input className="form-control form-control-sm" value={walkInPhone}
                    maxLength={10}
                    onChange={(e) => setWalkInPhone(e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className="mb-2">
                  <label className="form-label small mb-1">Approx. slot</label>
                  <select className="form-select form-select-sm" value={walkInSlot}
                    onChange={(e) => setWalkInSlot(e.target.value)}>
                    <option>Walk-in</option>
                    {(doctor?.timeSlots || []).map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <button className="btn btn-clinic btn-sm w-100" disabled={!doctor}>
                  Add to Queue (next token)
                </button>
              </form>
              <hr />
              <div className="small text-muted">
                Walk-ins get the next available token number. Payment is usually cash at
                counter — mark it collected from the dashboard after billing.
              </div>
            </div>
          </div>

          {/* leave / availability panel */}
          <div className="card card-clinic mt-3">
            <div className="card-body">
              <h6>Mark Leave / Unavailable</h6>
              <p className="text-muted small">
                Going on leave or stepping out? Mark it here — booked patients in those slots
                are <strong>rescheduled automatically</strong> to your next free slot and
                notified.
              </p>
              {leaveMsg && (
                <div className={`alert ${leaveMsg.autoRescheduled?.length ? 'alert-success' : 'alert-info'} py-2 small`}>
                  {leaveMsg.message}
                  {(leaveMsg.autoRescheduled || []).map((r, i) => (
                    <div key={i} className="mt-1">
                      → {r.cancelled ? `${r.patientName}: cancelled (no free slot)` : `${r.patientName}: moved to ${r.newDate} ${r.newSlot}`}
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={markLeave}>
                <div className="mb-2">
                  <label className="form-label small mb-1">Date (DD-MM-YYYY)</label>
                  <div className="input-group input-group-sm">
                    <input className="form-control" placeholder="e.g. 20-09-2026" value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)} />
                    <button type="button" className="btn btn-outline-secondary"
                      onClick={() => setLeaveDate(addDaysDDMMYYYY(1))}>Tomorrow</button>
                  </div>
                </div>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="fullDay"
                    checked={leaveFullDay} onChange={(e) => setLeaveFullDay(e.target.checked)} />
                  <label className="form-check-label small" htmlFor="fullDay">
                    Entire day (full leave)
                  </label>
                </div>
                {!leaveFullDay && (
                  <div className="mb-2">
                    <label className="form-label small mb-1">Only these slots are blocked</label>
                    <div className="d-flex flex-wrap">
                      {(doctor?.timeSlots || []).map((s) => (
                        <label key={s} className="me-2 small" style={{ minWidth: 90 }}>
                          <input type="checkbox" className="form-check-input me-1"
                            checked={leaveSlots.includes(s)}
                            onChange={(e) => {
                              if (e.target.checked) setLeaveSlots([...leaveSlots, s])
                              else setLeaveSlots(leaveSlots.filter((x) => x !== s))
                            }} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mb-2">
                  <input className="form-control form-control-sm" placeholder="Reason (optional) e.g. conference, emergency"
                    value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />
                </div>
                <button className="btn btn-outline-danger btn-sm w-100">Mark Unavailable</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorQueue
