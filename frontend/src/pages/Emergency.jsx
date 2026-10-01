import React, { useEffect, useState } from 'react'
import api from '../api/client'
import { getISTClock } from '../utils/format'

// Emergency page - 108 ambulance placeholder + pincode hospital locator.
// Kept simple and loud on purpose.
const Emergency = () => {
  const [pincode, setPincode] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [clock, setClock] = useState(getISTClock())

  // live IST clock in header strip
  useEffect(() => {
    const timer = setInterval(() => setClock(getISTClock()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 108 dispatch form
  const [callerName, setCallerName] = useState('')
  const [callerPhone, setCallerPhone] = useState('')
  const [condition, setCondition] = useState('')
  const [dispatchResult, setDispatchResult] = useState(null)

  const searchHospitals = async (e) => {
    e.preventDefault()
    setError('')
    setResults(null)
    if (!/^\d{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit Indian PIN code (e.g. 560038).')
      return
    }
    setLoading(true)
    try {
      const res = await api.get('/emergency/nearby-hospitals', { params: { pincode } })
      setResults(res.data)
    } catch (err) {
      console.log('hospital search error:', err)
      setError(err.response?.data?.message || 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const dispatchAmbulance = async (e) => {
    e.preventDefault()
    if (!callerName.trim() || callerPhone.replace(/\D/g, '').length !== 10) {
      setError('Please provide caller name and a valid 10-digit mobile number for ambulance dispatch.')
      return
    }
    try {
      const res = await api.post('/emergency/dispatch-108', {
        callerName,
        callerPhone,
        patientCondition: condition,
        locationAddress: `PIN ${pincode || 'not provided'}`,
        pincode: pincode || '',
      })
      setDispatchResult(res.data)
    } catch (err) {
      console.log('dispatch error:', err)
      setError('Could not reach dispatch service. Please dial 108 directly.')
    }
  }

  return (
    <div className="container mt-3">
      {/* emergency banner */}
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <div>
          <h4 className="alert-heading mb-1">🚑 Medical Emergency?</h4>
          <strong>Call 108</strong> — National Ambulance Service (free, 24×7, all India).
          {' '}Women &amp; child helpline: <strong>1098</strong>. Health helpline: <strong>104</strong>.
        </div>
        <div className="text-end d-none d-md-block">
          <div className="small text-muted">IST now</div>
          <div style={{ fontWeight: 700 }}>{clock}</div>
        </div>
      </div>

      {error && <div className="alert alert-warning py-2">{error}</div>}

      <div className="row">
        {/* hospital locator */}
        <div className="col-md-7">
          <div className="card card-clinic mb-3">
            <div className="card-body">
              <h5>Nearby Hospital Locator</h5>
              <p className="text-muted small">
                Enter your area PIN code to find emergency &amp; trauma care hospitals nearby.
                (Works with 6-digit Indian PIN codes.)
              </p>
              <form className="d-flex gap-2" onSubmit={searchHospitals}>
                <input className="form-control" placeholder="e.g. 560038 (Indiranagar, Bengaluru)"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} />
                <button className="btn btn-clinic" disabled={loading}>
                  {loading ? 'Searching...' : 'Find Hospitals'}
                </button>
              </form>

              {results && (
                <div className="mt-3">
                  <div className="small text-muted mb-2">
                    {results.count} hospitals near PIN {results.pincode} ·
                    Ambulance helpline: {results.ambulanceHelpline}
                  </div>
                  {results.hospitals.map((h, i) => (
                    <div className="card mb-2" key={i}>
                      <div className="card-body py-2">
                        <div className="d-flex justify-content-between">
                          <strong>{h.name}</strong>
                          <span className="badge bg-secondary">{h.distanceKm}</span>
                        </div>
                        <div className="small text-muted">{h.type}</div>
                        <div className="small">{h.address}</div>
                        <div className="small mt-1">
                          ☎ {h.emergencyPhone}
                          {h.hasEmergencyTrauma && <span className="badge bg-danger ms-2">Trauma Care</span>}
                          {h.hasICU && <span className="badge bg-dark ms-1">ICU</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 108 dispatch placeholder */}
        <div className="col-md-5">
          <div className="card card-clinic">
            <div className="card-body">
              <h5>Request 108 Ambulance</h5>
              <p className="text-muted small">
                Placeholder integration — in production this would connect to the state 108
                GVK-EMRI control room API. In an actual emergency, always dial 108 directly.
              </p>
              {dispatchResult ? (
                <div className="alert alert-success">
                  <strong>Alert sent! Dispatch ID: {dispatchResult.dispatchId}</strong>
                  <div className="small mt-1">
                    Ambulance {dispatchResult.ambulanceNumber} · ETA ~{dispatchResult.estimatedArrivalMinutes} min
                  </div>
                  <div className="small mt-1">{dispatchResult.message}</div>
                  <button className="btn btn-sm btn-outline-secondary mt-2"
                    onClick={() => setDispatchResult(null)}>Send another</button>
                </div>
              ) : (
                <form onSubmit={dispatchAmbulance}>
                  <div className="mb-2">
                    <label className="form-label small">Caller name *</label>
                    <input className="form-control form-control-sm" value={callerName}
                      onChange={(e) => setCallerName(e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Mobile number *</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">+91</span>
                      <input className="form-control" maxLength={10}
                        value={callerPhone}
                        onChange={(e) => setCallerPhone(e.target.value.replace(/\D/g, ''))} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Condition / emergency type</label>
                    <select className="form-select form-select-sm" value={condition}
                      onChange={(e) => setCondition(e.target.value)}>
                      <option value="">-- Select --</option>
                      <option>Cardiac / Chest pain</option>
                      <option>Accident / Trauma</option>
                      <option>Breathing difficulty</option>
                      <option>Pregnancy / Labour</option>
                      <option>Unconscious / Stroke</option>
                      <option>Burns</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="mb-2 small text-muted">
                    Location PIN: {pincode ? <strong>{pincode}</strong> : 'not set (use locator on the left)'}
                  </div>
                  <button className="btn btn-danger w-100">🚑 Send 108 Alert</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Emergency
