import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { formatINR } from '../utils/format'

// Admin - manage doctor registry (deactivate / view). Adding doctors happens via
// the register page with role=doctor, or here via link to register.
const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([])
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const res = await api.get('/doctor')
      setDoctors(res.data.doctors || [])
    } catch (err) {
      console.log('admin doctors load error:', err)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this doctor? They will no longer appear in search results.')) return
    try {
      await api.delete(`/doctor/${id}`)
      setMsg('Doctor deactivated.')
      load()
    } catch (err) {
      console.log('deactivate error:', err)
      setMsg(err.response?.data?.message || 'Failed to deactivate doctor.')
    }
  }

  return (
    <div className="container mt-3">
      <div className="d-flex justify-content-between align-items-center">
        <h3>Doctor Management</h3>
        <Link to="/register" className="btn btn-clinic btn-sm">+ Add Doctor (via registration)</Link>
      </div>
      <p className="text-muted small">
        All doctors carry MCI/NMC registration numbers. Deactivated doctors keep their history
        but disappear from public search.
      </p>

      {msg && <div className="alert alert-info py-2">{msg}</div>}

      <table className="table table-sm bg-white card-clinic">
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Specialization</th>
            <th>Degrees</th>
            <th>Reg. No</th>
            <th>Clinic (City)</th>
            <th>Fee</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((d) => (
            <tr key={d._id}>
              <td>{d.user?.name}<div className="small text-muted">{d.user?.phone}</div></td>
              <td>{d.specialization}<div><span className="badge bg-light text-dark border">{d.category}</span></div></td>
              <td className="small">{d.degrees?.join(', ')}</td>
              <td className="small">{d.mciRegNumber}</td>
              <td className="small">{d.clinicAddress?.clinicName}<div className="text-muted">{d.clinicAddress?.city}</div></td>
              <td>{formatINR(d.consultationFee)}</td>
              <td>
                <button className="btn btn-sm btn-outline-danger"
                  onClick={() => deactivate(d._id)}>
                  Deactivate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminDoctors
