import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { getISTClock } from '../utils/format'
import api from '../api/client'

// Homepage - hero, how it works, featured doctors, IST clock
const Home = () => {
  const { user } = useAuth()
  const { t } = useLang()
  const [clock, setClock] = useState(getISTClock())
  const [doctors, setDoctors] = useState([])
  const [stats, setStats] = useState({ doctors: 0, cities: 0 })

  // tick the IST clock every second (also proves IST is the default timezone)
  React.useEffect(() => {
    const timer = setInterval(() => setClock(getISTClock()), 1000)
    return () => clearInterval(timer)
  }, [])

  // load a few doctors for the featured section. repeated call with list page, fine for now
  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/doctor')
        const list = (res.data.doctors || []).slice(0, 3)
        setDoctors(list)
        setStats({
          doctors: res.data.count || 0,
          cities: new Set((res.data.doctors || []).map((d) => d.clinicAddress?.city)).size,
        })
      } catch (err) {
        console.log('home page doctor load failed', err.message)
      }
    }
    load()
  }, [])

  return (
    <div className="container">
      {/* Hero */}
      <div className="hero-clinic">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h1>Skip the queue at the clinic.</h1>
            <p className="lead mb-2">
              Book doctor appointments online and get your <strong>token number</strong> in
              advance — like taking a number at the clinic, but from your phone.
            </p>
            <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
              Allopathy, Ayurveda, Homeopathy &amp; more. Pay by UPI, Razorpay or cash at the
              clinic. Delhi · Mumbai · Bengaluru · Chennai · Hyderabad.
            </p>
            <Link to="/doctors" className="btn btn-clinic me-2">{t('findDoctors')}</Link>
            {!user && <Link to="/register" className="btn btn-outline-primary">{t('register')}</Link>}
          </div>
          <div className="col-md-4 text-center">
            <div className="token-box">
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>Current IST time</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16324f' }}>{clock}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                (UTC+5:30, Asia/Kolkata)
              </div>
            </div>
            <div className="mt-2 small text-muted">
              {stats.doctors} doctors · {stats.cities} cities online
            </div>
          </div>
        </div>
      </div>

      {/* clinic sections - Dental, Paediatric, Gynae, Heart, Common */}
      <h4 className="mt-4">Clinic Sections</h4>
      <p className="text-muted small mb-2">Jump straight to the type of clinic you need.</p>
      <div className="row">
        {[
          { name: 'Dental Clinic', icon: '🦷', desc: 'Root canal, braces, cleaning' },
          { name: 'Paediatric Clinic', icon: '🧒', desc: 'Child care & vaccinations' },
          { name: 'Gynecology Clinic', icon: '🤰', desc: 'Pregnancy & women\u2019s health' },
          { name: 'Heart Clinic', icon: '❤️', desc: 'Cardiology & BP checkups' },
          { name: 'General Clinic', icon: '🩺', desc: 'GP, fever, everyday care' },
        ].map((s) => (
          <div className="col-6 col-md-2 mb-2" key={s.name}>
            <Link to={`/doctors?clinicType=${encodeURIComponent(s.name)}`}
              className="d-block card-clinic p-2 text-center text-decoration-none" style={{ color: 'inherit' }}>
              <div style={{ fontSize: '1.6rem' }}>{s.icon}</div>
              <div className="small fw-bold">{s.name.replace(' Clinic', '')}</div>
              <div className="text-muted" style={{ fontSize: '0.68rem' }}>{s.desc}</div>
            </Link>
          </div>
        ))}
      </div>

      {/* How it works - written by the founder */}
      <h4 className="mt-4">{t('howItWorks')}</h4>
      <div className="row mt-2">
        <div className="col-md-4 mb-3">
          <div className="card-clinic p-3 h-100">
            <span className="step-circle">1</span>
            <strong>Find a doctor near you</strong>
            <p className="mb-0 small text-muted">
              Search by specialization — GP, dentist, gynecologist, Ayurveda and more. We show
              the consultation fee and degrees up front, no surprises at the counter.
            </p>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card-clinic p-3 h-100">
            <span className="step-circle">2</span>
            <strong>Pick a slot, get a token</strong>
            <p className="mb-0 small text-muted">
              Choose any free time slot (10:30 AM etc.). Your token number is confirmed
              instantly, so you know exactly where you stand in the queue.
            </p>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card-clinic p-3 h-100">
            <span className="step-circle">3</span>
            <strong>Visit the clinic, pay your way</strong>
            <p className="mb-0 small text-muted">
              Show your token at reception. Pay by UPI, Razorpay or plain cash — GST invoice
              included. Walk-ins are still welcome; they just wait a bit longer.
            </p>
          </div>
        </div>
      </div>

      {/* Featured doctors */}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <h4 className="mb-0">Featured Doctors</h4>
        <Link to="/doctors" className="small">View all →</Link>
      </div>
      <div className="row mt-2">
        {doctors.length === 0 && (
          <p className="text-muted">Loading doctors... (make sure the backend is running)</p>
        )}
        {doctors.map((doc) => (
          <div className="col-md-4 mb-3" key={doc._id}>
            <div className="card card-clinic h-100">
              <div className="card-body">
                <h5 className="mb-1">{doc.user?.name || 'Doctor'}</h5>
                <div className="text-muted small mb-1">
                  {doc.specialization} · {doc.degrees?.join(', ')}
                </div>
                <div className="small mb-2">📍 {doc.clinicAddress?.clinicName}, {doc.clinicAddress?.city}</div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-fee">{doc.consultationFee ? `₹${doc.consultationFee}` : ''}</span>
                  <Link to={`/doctors/${doc._id}`} className="btn btn-sm btn-outline-primary">
                    {t('viewDetails')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* emergency strip */}
      <div className="alert alert-danger mt-3">
        <strong>Medical emergency?</strong> Call <strong>108</strong> (free ambulance) or{' '}
        <Link to="/emergency">find the nearest hospital</Link> by pincode.
      </div>
    </div>
  )
}

export default Home
