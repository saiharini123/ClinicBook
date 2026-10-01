import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatINR, statusBadgeClass } from '../utils/format'

// Dashboard - renders a different view per role (patient / doctor / admin)
const Dashboard = () => {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/dashboard')
        setData(res.data)
      } catch (err) {
        console.log('dashboard load error:', err)
        setError(err.response?.data?.message || 'Could not load dashboard.')
      }
    }
    load()
  }, [])

  if (error) {
    return <div className="container mt-4"><div className="alert alert-danger">{error}</div></div>
  }
  if (!data) {
    return <div className="container mt-4 text-muted">Loading dashboard...</div>
  }

  const today = data.todayDate

  // ---------------- PATIENT ----------------
  if (data.role === 'patient') {
    const live = data.todayTokenLive
    return (
      <div className="container mt-3">
        <h3>Namaste, {user?.name?.split(' ')[0]} 👋</h3>
        <p className="text-muted small">Today: {today} (IST)</p>

        {/* live token widget */}
        {live && (
          <div className="token-box mb-3">
            <div className="row align-items-center">
              <div className="col-md-4">
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>YOUR TOKEN TODAY</div>
                <div className="token-number">#{live.tokenNumber}</div>
                <div className="small">{live.yourTimeSlot} · {live.doctorName}</div>
                <div className="small text-muted">{live.clinicName}</div>
              </div>
              <div className="col-md-4 text-center">
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>NOW SERVING</div>
                <div style={{ fontSize: '2.6rem', fontWeight: 700, color: '#0b7a3e' }}>
                  #{live.currentServingToken}
                </div>
                <div className="small text-muted">Patients ahead of you: {live.patientsAhead}</div>
              </div>
              <div className="col-md-4 text-end">
                <span className={`badge ${statusBadgeClass(live.status)}`}>{live.status}</span>
                <div>
                  <Link to={`/appointments/${live.appointmentId}`} className="btn btn-sm btn-outline-primary mt-2">
                    View details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="stat-tile">
              <div className="stat-value">{data.stats.upcomingCount}</div>
              <div className="text-muted small">Upcoming appointments</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-tile">
              <div className="stat-value">{data.stats.completedCount}</div>
              <div className="text-muted small">Completed visits</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="stat-tile">
              <div className="stat-value">{data.stats.totalBookings}</div>
              <div className="text-muted small">Total bookings</div>
            </div>
          </div>
        </div>

        <h5>Recent bookings</h5>
        {data.recentAppointments?.length === 0 && (
          <p className="text-muted">No bookings yet. <Link to="/doctors">Find a doctor →</Link></p>
        )}
        {data.recentAppointments?.map((a) => (
          <div className="card card-clinic mb-2" key={a._id}>
            <div className="card-body py-2 d-flex justify-content-between align-items-center">
              <div>
                <strong>Dr. {a.doctor?.user?.name}</strong>
                <span className="text-muted small"> · {a.doctor?.specialization}</span>
                <div className="small text-muted">
                  {a.appointmentDate} · {a.timeSlot} · Token #{a.tokenNumber}
                  {a.isFamilyMember && a.familyMemberDetails?.name && ` · for ${a.familyMemberDetails.name}`}
                </div>
              </div>
              <div className="text-end">
                <span className={`badge ${statusBadgeClass(a.status)}`}>{a.status}</span>
                <div><Link to={`/appointments/${a._id}`} className="small">Details →</Link></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ---------------- DOCTOR ----------------
  if (data.role === 'doctor') {
    return (
      <div className="container mt-3">
        <h3>Dr. {user?.name?.replace(/^Dr\.?\s*/i, '')}'s Dashboard</h3>
        <p className="text-muted small">
          {data.doctorInfo?.clinicName} · {data.doctorInfo?.specialization} ·
          Reg: {data.doctorInfo?.mciRegNumber} · Today: {today} (IST)
        </p>

        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <div className="stat-tile">
              <div className="stat-value">{data.stats.totalToday}</div>
              <div className="text-muted small">Tokens today</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-tile">
              <div className="stat-value">{data.stats.waitingToday}</div>
              <div className="text-muted small">Waiting</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-tile">
              <div className="stat-value">#{data.stats.currentServingToken}</div>
              <div className="text-muted small">Now serving</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stat-tile">
              <div className="stat-value">{data.stats.walkInsToday}/{data.stats.onlineToday}</div>
              <div className="text-muted small">Walk-in / Online</div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <h5>Today's queue ({today})</h5>
          <Link to="/queue" className="btn btn-sm btn-clinic">Open queue manager →</Link>
        </div>
        {data.todayQueue?.length === 0 && <p className="text-muted">No patients booked for today yet.</p>}
        {data.todayQueue?.map((a) => (
          <div className="card card-clinic mb-2" key={a._id}>
            <div className="card-body py-2">
              <div className="d-flex justify-content-between">
                <div>
                  <strong>#{a.tokenNumber} · {a.patientName}</strong>
                  {a.type === 'walk-in' && <span className="badge badge-walkin ms-1">walk-in</span>}
                  {a.isFamilyMember && <span className="badge bg-light text-dark border ms-1">family</span>}
                  <div className="small text-muted">
                    {a.timeSlot} · {a.patientPhone} · {a.symptoms ? a.symptoms.slice(0, 60) : 'No symptoms noted'}
                  </div>
                </div>
                <div>
                  <span className={`badge ${statusBadgeClass(a.status)}`}>{a.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ---------------- ADMIN ----------------
  return (
    <div className="container mt-3">
      <h3>Admin Dashboard</h3>
      <p className="text-muted small">
        Clinic GSTIN: {data.stats.clinicGstin} · Today: {today} (IST)
      </p>

      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="stat-tile">
            <div className="stat-value">{data.stats.totalPatients}</div>
            <div className="text-muted small">Registered patients</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-tile">
            <div className="stat-value">{data.stats.totalDoctors}</div>
            <div className="text-muted small">Active doctors</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-tile">
            <div className="stat-value">{data.stats.totalAppointments}</div>
            <div className="text-muted small">Total appointments</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-tile">
            <div className="stat-value">{formatINR(data.stats.totalRevenue)}</div>
            <div className="text-muted small">Revenue (incl. GST)</div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="stat-tile">
            <div className="stat-value">{formatINR(data.stats.totalGstCollected)}</div>
            <div className="text-muted small">GST collected (GSTR-1)</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-tile">
            <div className="stat-value">{formatINR(data.stats.cgst)} / {formatINR(data.stats.sgst)}</div>
            <div className="text-muted small">CGST / SGST</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-tile">
            <div className="stat-value">{formatINR(data.stats.igst)}</div>
            <div className="text-muted small">IGST</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-tile">
            <div className="stat-value">{data.stats.walkInCount}/{data.stats.onlineCount}</div>
            <div className="text-muted small">Walk-in / Online</div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <h5>Recent bookings</h5>
        <Link to="/admin/doctors" className="btn btn-sm btn-outline-primary">Manage doctors →</Link>
      </div>
      {data.recentBookings?.map((a) => (
        <div className="card card-clinic mb-2" key={a._id}>
          <div className="card-body py-2 d-flex justify-content-between">
            <div>
              <strong>{a.patientName}</strong>
              <span className="text-muted small"> → Dr. {a.doctor?.user?.name} ({a.doctor?.specialization})</span>
              <div className="small text-muted">
                {a.appointmentDate} · {a.timeSlot} · Token #{a.tokenNumber} · {a.type} ·{' '}
                {a.gstDetails?.totalFee ? formatINR(a.gstDetails.totalFee) : ''} ({a.paymentStatus})
              </div>
            </div>
            <span className={`badge ${statusBadgeClass(a.status)}`} style={{ height: 26 }}>{a.status}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Dashboard
