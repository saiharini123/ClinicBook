import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ALL_STATES, getDistricts } from '../utils/indiaDistricts'

// Profile page - patient profile with family members, masked Aadhaar, emergency contact.
// Doctors see their clinic profile summary here too.
const Profile = () => {
  const { user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  // editable fields
  const [form, setForm] = useState({
    bloodGroup: 'Unknown',
    dateOfBirth: '',
    gender: 'Male',
    aadhaarInput: '',
    street: '',
    city: '',
    state: 'Karnataka',
    pincode: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
  })

  // new family member form
  const [member, setMember] = useState({ name: '', relation: 'Spouse', age: '', gender: 'Male', phone: '', bloodGroup: '' })
  const [memberMsg, setMemberMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      if (user?.role !== 'patient') return
      try {
        const res = await api.get('/patient/me')
        const p = res.data.patient
        setPatient(p)
        setForm((f) => ({
          ...f,
          bloodGroup: p.bloodGroup || 'Unknown',
          dateOfBirth: p.dateOfBirth || '',
          gender: p.gender || 'Male',
          street: p.address?.street || '',
          city: p.address?.city || '',
          state: p.address?.state || 'Karnataka',
          pincode: p.address?.pincode || '',
          emergencyName: p.emergencyContact?.name || '',
          emergencyRelation: p.emergencyContact?.relation || '',
          emergencyPhone: p.emergencyContact?.phone || '',
        }))
      } catch (err) {
        console.log('profile load error:', err.message)
        setError('Could not load your profile.')
      }
    }
    load()
  }, [user])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const saveProfile = async (e) => {
    e.preventDefault()
    setError('')
    if (form.pincode && form.pincode.length !== 6) {
      setError('PIN code must be exactly 6 digits.')
      return
    }
    if (form.emergencyPhone && form.emergencyPhone.length !== 10) {
      setError('Please enter valid emergency contact mobile number (10 digits).')
      return
    }
    try {
      const payload = {
        bloodGroup: form.bloodGroup,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        emergencyContact: {
          name: form.emergencyName,
          relation: form.emergencyRelation,
          phone: form.emergencyPhone,
        },
      }
      if (form.aadhaarInput.replace(/\D/g, '').length === 12) {
        payload.aadhaarNumber = form.aadhaarInput // only masked version is stored server-side
      }
      const res = await api.put('/patient/me', payload)
      setPatient(res.data.patient)
      setMsg('Profile saved successfully.')
      setForm((f) => ({ ...f, aadhaarInput: '' }))
    } catch (err) {
      console.log('profile save error:', err)
      setError(err.response?.data?.message || 'Could not save profile.')
    }
  }

  const addMember = async (e) => {
    e.preventDefault()
    setMemberMsg('')
    if (!member.name.trim()) { setMemberMsg('Please enter family member name.'); return }
    if (!member.age || Number(member.age) <= 0 || Number(member.age) > 120) {
      setMemberMsg('Please enter a valid age (1-120).')
      return
    }
    try {
      const res = await api.post('/patient/family', {
        ...member,
        age: Number(member.age),
      })
      setMemberMsg(res.data.message)
      setMember({ name: '', relation: 'Spouse', age: '', gender: 'Male', phone: '', bloodGroup: '' })
      // refresh profile
      const p = await api.get('/patient/me')
      setPatient(p.data.patient)
    } catch (err) {
      console.log('add member error:', err)
      setMemberMsg(err.response?.data?.message || 'Could not add family member.')
    }
  }

  const removeMember = async (memberId) => {
    if (!window.confirm('Remove this family member?')) return
    try {
      await api.delete(`/patient/family/${memberId}`)
      const p = await api.get('/patient/me')
      setPatient(p.data.patient)
    } catch (err) {
      console.log('remove member error:', err)
    }
  }

  if (user?.role === 'doctor') {
    return (
      <div className="container mt-3">
        <h3>Doctor Profile</h3>
        <div className="card card-clinic mt-2">
          <div className="card-body">
            <h5>{user.name}</h5>
            {user.roleDetails ? (
              <>
                <div className="mb-1">{user.roleDetails.specialization} ({user.roleDetails.category})</div>
                <div className="mb-1">Degrees: {user.roleDetails.degrees?.join(', ')}</div>
                <div className="mb-1">MCI/NMC Reg: {user.roleDetails.mciRegNumber}</div>
                <div className="mb-1">Experience: {user.roleDetails.experienceYears} years</div>
                <div className="mb-1">Fee: ₹{user.roleDetails.consultationFee}</div>
                <hr />
                <strong>Clinic</strong>
                <div>{user.roleDetails.clinicAddress?.clinicName}</div>
                <div className="small text-muted">
                  {user.roleDetails.clinicAddress?.addressLine}, {user.roleDetails.clinicAddress?.city},{' '}
                  {user.roleDetails.clinicAddress?.state} - {user.roleDetails.clinicAddress?.pincode}
                </div>
              </>
            ) : (
              <p className="text-muted">Loading doctor details...</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (user?.role === 'admin') {
    return (
      <div className="container mt-3">
        <h3>Admin Profile</h3>
        <p className="text-muted">Admin account: {user.email}. Manage doctors from the dashboard.</p>
        <Link to="/admin/doctors" className="btn btn-clinic">Go to Doctor Management</Link>
      </div>
    )
  }

  return (
    <div className="container mt-3">
      <h3>My Profile</h3>
      <p className="text-muted small">
        {user?.name} · {user?.countryCode} {user?.phone} · {user?.email}
      </p>

      {msg && <div className="alert alert-success py-2">{msg}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row">
        <div className="col-md-7">
          <form onSubmit={saveProfile}>
            <div className="card card-clinic mb-3">
              <div className="card-body">
                <h6>Personal &amp; Identity</h6>
                <div className="row">
                  <div className="col-md-4 mb-2">
                    <label className="form-label small">Blood Group</label>
                    <select className="form-select form-select-sm" value={form.bloodGroup}
                      onChange={(e) => set('bloodGroup', e.target.value)}>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label small">Date of Birth (DD-MM-YYYY)</label>
                    <input className="form-control form-control-sm" value={form.dateOfBirth}
                      placeholder="14-07-1988"
                      onChange={(e) => set('dateOfBirth', e.target.value)} />
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label small">Gender</label>
                    <select className="form-select form-select-sm" value={form.gender}
                      onChange={(e) => set('gender', e.target.value)}>
                      {['Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label className="form-label small">Aadhaar Number (optional)</label>
                    <input className="form-control form-control-sm" value={form.aadhaarInput}
                      onChange={(e) => set('aadhaarInput', e.target.value)}
                      placeholder="12 digits — stored masked only" />
                    {patient?.aadhaarNumberMasked && (
                      <div className="form-text">Currently on file: {patient.aadhaarNumberMasked}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card card-clinic mb-3">
              <div className="card-body">
                <h6>Address</h6>
                <div className="row">
                  <div className="col-md-12 mb-2">
                    <label className="form-label small">Street / Area</label>
                    <input className="form-control form-control-sm" value={form.street}
                      onChange={(e) => set('street', e.target.value)} />
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label small">State</label>
                    <select className="form-select form-select-sm" value={form.state}
                      onChange={(e) => {
                        set('state', e.target.value)
                        set('city', getDistricts(e.target.value)[0] || '')
                      }}>
                      {ALL_STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label small">City / District</label>
                    <select className="form-select form-select-sm" value={form.city}
                      onChange={(e) => set('city', e.target.value)}>
                      {getDistricts(form.state).map((c) => <option key={c}>{c}</option>)}
                      {/* keep an existing saved city visible even if not in district list */}
                      {form.city && !getDistricts(form.state).includes(form.city) && (
                        <option value={form.city}>{form.city}</option>
                      )}
                    </select>
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label small">PIN Code</label>
                    <input className="form-control form-control-sm" value={form.pincode}
                      maxLength={6}
                      onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card card-clinic mb-3">
              <div className="card-body">
                <h6>Emergency Contact</h6>
                <div className="row">
                  <div className="col-md-4 mb-2">
                    <label className="form-label small">Name</label>
                    <input className="form-control form-control-sm" value={form.emergencyName}
                      onChange={(e) => set('emergencyName', e.target.value)} />
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label small">Relation</label>
                    <input className="form-control form-control-sm" value={form.emergencyRelation}
                      onChange={(e) => set('emergencyRelation', e.target.value)}
                      placeholder="Spouse / Father / etc." />
                  </div>
                  <div className="col-md-4 mb-2">
                    <label className="form-label small">Mobile</label>
                    <input className="form-control form-control-sm" value={form.emergencyPhone}
                      maxLength={10}
                      onChange={(e) => set('emergencyPhone', e.target.value.replace(/\D/g, ''))} />
                  </div>
                </div>
              </div>
            </div>

            <button className="btn btn-clinic mb-4">Save Profile</button>
          </form>
        </div>

        <div className="col-md-5">
          <div className="card card-clinic">
            <div className="card-body">
              <h6>Family Members</h6>
              <p className="text-muted small mb-2">
                Book for your family in one click (very common for parents and kids).
              </p>

              {memberMsg && <div className="alert alert-info py-1 small">{memberMsg}</div>}

              {(patient?.familyMembers || []).length === 0 && (
                <div className="text-muted small mb-2">No family members added yet.</div>
              )}
              {(patient?.familyMembers || []).map((m) => (
                <div className="d-flex justify-content-between align-items-center border-bottom py-1" key={m._id}>
                  <div className="small">
                    <strong>{m.name}</strong> ({m.relation}, {m.age} yrs, {m.gender})
                    {m.bloodGroup && m.bloodGroup !== 'Not specified' && (
                      <span className="badge bg-light text-dark border ms-1">{m.bloodGroup}</span>
                    )}
                  </div>
                  <button className="btn btn-sm btn-outline-danger py-0" onClick={() => removeMember(m._id)}>
                    ✕
                  </button>
                </div>
              ))}

              <hr />
              <form onSubmit={addMember}>
                <div className="row g-2">
                  <div className="col-12">
                    <input className="form-control form-control-sm" placeholder="Name *"
                      value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <select className="form-select form-select-sm" value={member.relation}
                      onChange={(e) => setMember({ ...member, relation: e.target.value })}>
                      {['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Sibling', 'Other'].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <input className="form-control form-control-sm" placeholder="Age *" type="number"
                      value={member.age} onChange={(e) => setMember({ ...member, age: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <select className="form-select form-select-sm" value={member.gender}
                      onChange={(e) => setMember({ ...member, gender: e.target.value })}>
                      {['Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <input className="form-control form-control-sm" placeholder="Blood group"
                      value={member.bloodGroup}
                      onChange={(e) => setMember({ ...member, bloodGroup: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-sm btn-outline-primary w-100">+ Add family member</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
