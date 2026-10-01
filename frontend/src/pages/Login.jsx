import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

// Login page - email/phone + password, plus OTP login for Indian mobiles
const Login = () => {
  const navigate = useNavigate()
  const { saveSession } = useAuth()

  const [mode, setMode] = useState('password') // or 'otp'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // password login
  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!identifier.trim()) {
      setError('Please enter your registered email or mobile number.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post('/auth/login', { identifier: identifier.trim(), password })
      saveSession(res.data.token, { ...res.data.user, token: res.data.token })
      navigate('/dashboard')
    } catch (err) {
      console.log('login failed:', err)
      setError(err.response?.data?.message || 'Login failed. Please check the server connection.')
    } finally {
      setSubmitting(false)
    }
  }

  // step 1: send OTP to Indian mobile number
  const handleSendOtp = async () => {
    setError('')
    setInfo('')
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number (starting 6-9).')
      return
    }
    try {
      const res = await api.post('/auth/send-otp', { phone: digits })
      setOtpSent(true)
      setInfo(res.data.message) // shows the demo OTP hint too
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP. Please try again.')
    }
  }

  // step 2: verify OTP (auto-registers new patients)
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP you received by SMS.')
      return
    }
    try {
      const res = await api.post('/auth/verify-otp', {
        phone: phone.replace(/\D/g, ''),
        otp,
      })
      saveSession(res.data.token, { ...res.data.user, token: res.data.token })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.')
    }
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card card-clinic">
            <div className="card-body">
              <h3 className="mb-1">Login</h3>
              <p className="text-muted small">
                Use your email or +91 mobile number. New here? <Link to="/register">Register</Link>
              </p>

              {/* mode switch */}
              <div className="btn-group btn-group-sm mb-3">
                <button
                  className={`btn ${mode === 'password' ? 'btn-clinic' : 'btn-outline-secondary'}`}
                  onClick={() => setMode('password')}
                >
                  Password
                </button>
                <button
                  className={`btn ${mode === 'otp' ? 'btn-clinic' : 'btn-outline-secondary'}`}
                  onClick={() => setMode('otp')}
                >
                  Login via OTP
                </button>
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}
              {info && <div className="alert alert-info py-2">{info}</div>}

              {mode === 'password' ? (
                <form onSubmit={handlePasswordLogin}>
                  <div className="mb-3">
                    <label className="form-label">Email or Mobile Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. rajesh.sharma@example.com or 9876501234"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                    <div className="form-text">
                      Indian numbers: enter 10 digits. International: include country code.
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-clinic w-100" disabled={submitting}>
                    {submitting ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div className="mb-3">
                    <label className="form-label">Mobile Number (India, +91)</label>
                    <div className="input-group">
                      <span className="input-group-text">+91</span>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="9876543210"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        disabled={otpSent}
                      />
                    </div>
                  </div>
                  {!otpSent ? (
                    <button type="button" className="btn btn-clinic w-100" onClick={handleSendOtp}>
                      Send OTP
                    </button>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Enter 6-digit OTP</label>
                        <input
                          type="text"
                          className="form-control"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="------"
                          style={{ letterSpacing: '6px' }}
                        />
                        <div className="form-text">Valid for 10 minutes. Didn't get it? Resend after a minute.</div>
                      </div>
                      <button className="btn btn-clinic w-100">Verify &amp; Login</button>
                      <button
                        type="button"
                        className="btn btn-link btn-sm"
                        onClick={() => { setOtpSent(false); setOtp(''); setInfo('') }}
                      >
                        Change number / resend
                      </button>
                    </>
                  )}
                </form>
              )}

              {/* demo credentials - handy while testing */}
              <hr />
              <div className="small text-muted">
                <strong>Demo accounts</strong> (from seed data):
                <div>Patient: <code>rajesh.sharma@example.com</code> / <code>Patient@123</code></div>
                <div>Doctor: <code>dr.vikram@clinicbook.in</code> / <code>Doctor@123</code></div>
                <div>Admin: <code>admin@clinicbook.in</code> / <code>Admin@123</code></div>
                <div className="mt-1">OTP login: any 10-digit number, OTP <code>123456</code></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
