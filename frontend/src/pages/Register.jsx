import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { COUNTRY_CODES } from '../utils/indiaData'
import { ALL_STATES, getDistricts } from '../utils/indiaDistricts'

// Register page - Indian defaults (+91, Indian state/city), international codes supported
const Register = () => {
  const navigate = useNavigate()
  const { saveSession } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    countryCode: '+91',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    // patient extras
    aadhaarNumber: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    // doctor extras (kept on same page for simplicity)
    specialization: 'General Physician',
    clinicType: 'General Clinic',
    degrees: 'MBBS',
    mciRegNumber: '',
    consultationFee: 500,
    clinicName: '',
    clinicAddressLine: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  // validate everything client side before hitting the api
  const validate = () => {
    if (!form.name.trim()) return 'Please enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email address.'
    const digits = form.phone.replace(/\D/g, '')
    if (form.countryCode === '+91' && digits.length !== 10) {
      return 'Please enter valid mobile number (10 digits for Indian numbers).'
    }
    if (form.countryCode !== '+91' && digits.length < 7) {
      return 'Please enter a valid mobile number for the selected country.'
    }
    if (form.password.length < 6) return 'Password must be at least 6 characters long.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match. Please retype.'
    if (form.role === 'doctor') {
      if (!form.mciRegNumber.trim()) return 'MCI/NMC registration number is mandatory for doctors.'
      if (!form.clinicName.trim()) return 'Please enter your clinic name.'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\D/g, ''),
        countryCode: form.countryCode,
        password: form.password,
        role: form.role,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      }
      if (form.aadhaarNumber.replace(/\D/g, '').length === 12) {
        payload.aadhaarNumber = form.aadhaarNumber // optional, backend masks it
      }
      if (form.role === 'doctor') {
        payload.specialization = form.specialization
        payload.clinicType = form.clinicType
        payload.degrees = form.degrees.split(',').map((d) => d.trim()).filter(Boolean)
        payload.mciRegNumber = form.mciRegNumber
        payload.consultationFee = Number(form.consultationFee)
        payload.clinicName = form.clinicName
        payload.clinicAddressLine = form.clinicAddressLine
      }
      const res = await api.post('/auth/register', payload)
      saveSession(res.data.token, { ...res.data.user, token: res.data.token })
      navigate('/dashboard')
    } catch (err) {
      console.log('register error:', err.response?.data)
      setError(err.response?.data?.message || 'Registration failed. Please try again in a bit.')
    } finally {
      setSubmitting(false)
    }
  }

  const isIndia = form.countryCode === '+91'
  const cities = getDistricts(form.state) // now the full district list

  // doctor section: clinic type dropdown options
  const CLINIC_TYPES = ['General Clinic', 'Dental Clinic', 'Paediatric Clinic', 'Gynecology Clinic', 'Heart Clinic']

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card card-clinic">
            <div className="card-body">
              <h3 className="mb-1">Create your account</h3>
              <p className="text-muted small mb-3">
                Already registered? <Link to="/login">Login here</Link>
              </p>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="e.g. Rajesh Sharma" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email *</label>
                    <input type="email" className="form-control" value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="you@example.com" />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Mobile Number *</label>
                    <div className="input-group">
                      <select
                        className="form-select"
                        style={{ maxWidth: 130 }}
                        value={form.countryCode}
                        onChange={(e) => set('countryCode', e.target.value)}
                        title="Country code (India default)"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        className="form-control"
                        value={form.phone}
                        onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
                        maxLength={isIndia ? 10 : 15}
                        placeholder={isIndia ? '9876543210' : 'Phone number'}
                      />
                    </div>
                    <div className="form-text">
                      {isIndia
                        ? 'OTP verification optional for Indian numbers (available on login page).'
                        : 'International numbers: verification via email currently.'}
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Password *</label>
                    <input type="password" className="form-control" value={form.password}
                      onChange={(e) => set('password', e.target.value)} />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">Confirm Password *</label>
                    <input type="password" className="form-control" value={form.confirmPassword}
                      onChange={(e) => set('confirmPassword', e.target.value)} />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">I am a...</label>
                    <select className="form-select" value={form.role}
                      onChange={(e) => set('role', e.target.value)}>
                      <option value="patient">Patient (book appointments)</option>
                      <option value="doctor">Doctor (list my clinic)</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">State</label>
                    <select className="form-select" value={form.state}
                      onChange={(e) => {
                        set('state', e.target.value)
                        const first = getDistricts(e.target.value)[0]
                        set('city', first || '')
                      }}>
                      {/* full list: all states + UTs (35) */}
                      {ALL_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">City / District</label>
                    <select className="form-select" value={form.city}
                      onChange={(e) => set('city', e.target.value)}>
                      {/* all districts of the selected state */}
                      {getDistricts(form.state).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">PIN Code</label>
                    <input className="form-control" value={form.pincode}
                      maxLength={6}
                      onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))}
                      placeholder="560038" />
                  </div>
                  {form.role === 'patient' && (
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Aadhaar Number (optional)</label>
                      <input className="form-control" value={form.aadhaarNumber}
                        onChange={(e) => set('aadhaarNumber', e.target.value)}
                        placeholder="XXXX-XXXX-1234" />
                      <div className="form-text">
                        Stored masked (only last 4 digits kept). Helps at clinic reception.
                      </div>
                    </div>
                  )}
                </div>

                {/* doctor-only section */}
                {form.role === 'doctor' && (
                  <fieldset className="border p-3 mb-3">
                    <legend className="fs-6">Doctor / Clinic details</legend>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Specialization *</label>
                        <select className="form-select" value={form.specialization}
                          onChange={(e) => set('specialization', e.target.value)}>
                          {['General Physician', 'Ayurveda', 'Homeopathy', 'Unani', 'Dentist',
                            'Orthopedic', 'Gynecologist', 'Pediatrician', 'Cardiologist',
                            'Dermatologist', 'ENT Specialist'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Clinic Section *</label>
                        <select className="form-select" value={form.clinicType}
                          onChange={(e) => set('clinicType', e.target.value)}>
                          {CLINIC_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Degrees (comma separated) *</label>
                        <input className="form-control" value={form.degrees}
                          onChange={(e) => set('degrees', e.target.value)}
                          placeholder="MBBS, MD (General Medicine)" />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">MCI / NMC Reg. No. *</label>
                        <input className="form-control" value={form.mciRegNumber}
                          onChange={(e) => set('mciRegNumber', e.target.value)}
                          placeholder="e.g. NMC-KA-2015-12345" />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Consultation Fee (₹)</label>
                        <input type="number" className="form-control" value={form.consultationFee}
                          onChange={(e) => set('consultationFee', e.target.value)} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Clinic Name</label>
                        <input className="form-control" value={form.clinicName}
                          onChange={(e) => set('clinicName', e.target.value)}
                          placeholder="e.g. Arogya Family Health Clinic" />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Clinic Address</label>
                      <input className="form-control" value={form.clinicAddressLine}
                        onChange={(e) => set('clinicAddressLine', e.target.value)}
                        placeholder="Street / area / landmark" />
                    </div>
                  </fieldset>
                )}

                <button className="btn btn-clinic" disabled={submitting}>
                  {submitting ? 'Creating account...' : 'Register'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
