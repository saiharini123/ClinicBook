import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'

// top navbar - role aware links
const Navbar = () => {
  const { user, logout } = useAuth()
  const { lang, changeLang, languages, t } = useLang()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom mb-3">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/" style={{ color: '#1a5f9e' }}>
          🏥 ClinicBook 
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/doctors">{t('findDoctors')}</NavLink>
            </li>
            {user && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/dashboard">{t('dashboard')}</NavLink>
              </li>
            )}
            {user && user.role === 'patient' && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/my-appointments">{t('myAppointments')}</NavLink>
              </li>
            )}
            {user && user.role === 'doctor' && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/queue">Queue</NavLink>
              </li>
            )}
            <li className="nav-item">
              <NavLink className="nav-link" to="/emergency">{t('emergency')}</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/contact">Contact</NavLink>
            </li>
          </ul>

          {/* language toggle - simple select, no fancy dropdown */}
          <select
            className="form-select form-select-sm me-2"
            style={{ maxWidth: 150 }}
            value={lang}
            onChange={(e) => changeLang(e.target.value)}
            title="Choose language"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          {user ? (
            <>
              <span className="navbar-text me-3 text-truncate" style={{ maxWidth: 200 }}>
                Hi, {user.name}
                <span className="badge bg-secondary ms-1 text-uppercase" style={{ fontSize: '0.65rem' }}>
                  {user.role}
                </span>
              </span>
              <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-primary btn-sm me-2">{t('login')}</Link>
              <Link to="/register" className="btn btn-clinic btn-sm">{t('register')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
