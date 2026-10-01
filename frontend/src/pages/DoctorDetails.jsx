import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import { formatINR, approxForeignCurrency } from '../utils/format'

// Doctor profile page
const DoctorDetails = () => {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/doctor/${id}`)
        setDoctor(res.data.doctor)
      } catch (err) {
        console.log('doctor details load failed:', err.message)
        setNotFound(true)
      }
    }
    load()
  }, [id])

  if (notFound) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">Doctor profile not found. It may have been removed.</div>
        <Link to="/doctors" className="btn btn-clinic">Back to doctor list</Link>
      </div>
    )
  }

  if (!doctor) {
    return <div className="container mt-4 text-muted">Loading doctor profile...</div>
  }

  return (
    <div className="container mt-3">
      <Link to="/doctors" className="small">← Back to all doctors</Link>
      <div className="row mt-2">
        <div className="col-md-8">
          <div className="card card-clinic">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h3 className="mb-0">{doctor.user?.name}</h3>
                  <div className="text-muted">
                    {doctor.specialization} ({doctor.category})
                  </div>
                </div>
                <span className="badge bg-success">⭐ {doctor.rating || 4.5}</span>
              </div>

              <hr />
              <div className="row">
                <div className="col-sm-6">
                  <strong>Degrees:</strong>
                  <div className="mb-2">{doctor.degrees?.join(', ')}</div>
                  <strong>Registration:</strong>
                  <div className="mb-2">
                    {doctor.mciRegNumber}{' '}
                    <span className="text-muted small">(MCI/NMC verified)</span>
                  </div>
                  <strong>Experience:</strong>
                  <div className="mb-2">{doctor.experienceYears} years</div>
                </div>
                <div className="col-sm-6">
                  <strong>Clinic:</strong>
                  <div className="mb-2">
                    {doctor.clinicAddress?.clinicName}<br />
                    {doctor.clinicAddress?.addressLine}<br />
                    {doctor.clinicAddress?.city}, {doctor.clinicAddress?.state} -{' '}
                    {doctor.clinicAddress?.pincode}
                  </div>
                </div>
              </div>

              <strong>About</strong>
              <p className="mb-2">{doctor.bio}</p>

              <div className="row">
                <div className="col-md-6">
                  <strong>Available Days</strong>
                  <div>
                    {doctor.availableDays?.map((d) => (
                      <span key={d} className="badge bg-light text-dark border me-1 mb-1">{d}</span>
                    ))}
                  </div>
                </div>
                <div className="col-md-6">
                  <strong>Consultation Fee</strong>
                  <div className="text-fee" style={{ fontSize: '1.3rem' }}>
                    {formatINR(doctor.consultationFee)}
                  </div>
                  <div className="text-muted small">{approxForeignCurrency(doctor.consultationFee)}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    + 18% GST as applicable (CGST/SGST or IGST). Government hospital rates not
                    applicable to private practice.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card card-clinic">
            <div className="card-body">
              <h5>Time Slots</h5>
              <p className="text-muted small mb-2">
                Slot times in 12-hour format (IST). Booked slots are struck through on the
                booking page for your selected date.
              </p>
              <div>
                {doctor.timeSlots?.map((slot) => (
                  <span key={slot} className="badge bg-light text-dark border me-1 mb-1">{slot}</span>
                ))}
              </div>
              <hr />
              <Link to={`/doctors/${doctor._id}/book`} className="btn btn-clinic w-100">
                Book Appointment
              </Link>
              <div className="text-muted mt-2" style={{ fontSize: '0.78rem' }}>
                Token number is assigned instantly after booking. Walk-ins also accepted at the
                clinic but online bookings are seen first.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDetails
