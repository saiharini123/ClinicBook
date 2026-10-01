import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { formatINR, approxForeignCurrency } from '../utils/format'
import { ALL_STATES, getDistricts } from '../utils/indiaDistricts'

const CLINIC_TYPES = ['All', 'General Clinic', 'Dental Clinic', 'Paediatric Clinic', 'Gynecology Clinic', 'Heart Clinic']

// Doctor list page with filters (clinic section, specialization, category, district) and search
const DoctorList = () => {
  // reads ?clinicType=... when arriving from a homepage section tile
  const [searchParams] = useSearchParams()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    specialization: 'All',
    category: 'All',
    clinicType: searchParams.get('clinicType') || 'All',
    city: '',
  })

  const SPECIALIZATIONS = ['All', 'General Physician', 'Ayurveda', 'Homeopathy', 'Unani',
    'Dentist', 'Orthopedic', 'Gynecologist', 'Pediatrician', 'Cardiologist',
    'Dermatologist', 'ENT Specialist']
  const CATEGORIES = ['All', 'Allopathy', 'AYUSH', 'Dental', 'Specialist']

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.specialization !== 'All') params.specialization = filters.specialization
      if (filters.category !== 'All') params.category = filters.category
      if (filters.clinicType !== 'All') params.clinicType = filters.clinicType
      if (filters.city) params.city = filters.city
      if (filters.search) params.search = filters.search
      const res = await api.get('/doctor', { params })
      setDoctors(res.data.doctors || [])
    } catch (err) {
      console.log('doctor list error:', err.message)
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  // reload whenever dropdown filters change. could debounce search but ok for now
  useEffect(() => {
    loadDoctors()
  }, [filters.specialization, filters.category, filters.clinicType, filters.city])

  // also react when user clicks a homepage section tile while already on this page
  useEffect(() => {
    const ct = searchParams.get('clinicType')
    if (ct && ct !== filters.clinicType) {
      setFilters((f) => ({ ...f, clinicType: ct }))
    }
  }, [searchParams])

  // search needs the button/enter
  const handleSearch = (e) => {
    e.preventDefault()
    loadDoctors()
  }

  return (
    <div className="container mt-3">
      <h3>Find Doctors</h3>
      <p className="text-muted small">
        Verified doctors with MCI/NMC registration. Fees shown in ₹ (approx. foreign currency on
        each card for international visitors).
      </p>

      {/* clinic section quick-filter chips */}
      <div className="mb-2 d-flex flex-wrap gap-1">
        {CLINIC_TYPES.map((ct) => (
          <button key={ct}
            className={`btn btn-sm ${filters.clinicType === ct ? 'btn-clinic' : 'btn-outline-secondary'}`}
            onClick={() => setFilters({ ...filters, clinicType: ct })}>
            {ct === 'All' ? 'All Sections' : ct}
          </button>
        ))}
      </div>

      {/* filter bar */}
      <form className="row g-2 mb-3" onSubmit={handleSearch}>
        <div className="col-md-3">
          <input className="form-control form-control-sm" placeholder="Search name / clinic"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <div className="col-md-3">
          <select className="form-select form-select-sm" value={filters.specialization}
            onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}>
            {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select form-select-sm" value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select form-select-sm" value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}>
            <option value="">All Districts</option>
            {ALL_STATES.map((s) => (
              <optgroup key={s} label={s}>
                {getDistricts(s).map((d) => <option key={s + d} value={d}>{d}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-clinic btn-sm w-100">Search</button>
        </div>
      </form>

      {loading && <p className="text-muted">Loading doctors...</p>}
      {!loading && doctors.length === 0 && (
        <div className="alert alert-info">
          No doctors matched your filters. Try clearing the city or specialization filter.
        </div>
      )}

      <div className="row">
        {doctors.map((doc) => (
          <div className="col-md-4 mb-3" key={doc._id}>
            <div className="card card-clinic h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <h5 className="mb-0">{doc.user?.name || 'Dr.'}</h5>
                  <span className="badge bg-success">⭐ {doc.rating || 4.5}</span>
                </div>
                <div className="text-muted small">
                  {doc.specialization} · {doc.category}
                </div>
                <div className="small mb-1">{doc.degrees?.join(', ')}</div>
                <div className="small text-muted mb-1">
                  Reg. No: {doc.mciRegNumber} · {doc.experienceYears} yrs exp
                </div>
                <div className="small mb-2">
                  📍 {doc.clinicAddress?.clinicName}, {doc.clinicAddress?.city},{' '}
                  {doc.clinicAddress?.state} - {doc.clinicAddress?.pincode}
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-fee">{formatINR(doc.consultationFee)}</span>{' '}
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {approxForeignCurrency(doc.consultationFee)}
                    </span>
                  </div>
                  <Link to={`/doctors/${doc._id}`} className="btn btn-sm btn-clinic">
                    View &amp; Book
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DoctorList
