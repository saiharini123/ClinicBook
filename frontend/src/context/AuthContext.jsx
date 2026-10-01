import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

// AuthContext - stores logged in user + token, persists in localStorage
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  // read from localStorage on first load so refresh keeps you logged in
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('clinicbook_user')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      console.log('failed to parse saved user', e)
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  const saveSession = (token, userData) => {
    localStorage.setItem('clinicbook_token', token)
    localStorage.setItem('clinicbook_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('clinicbook_token')
    localStorage.removeItem('clinicbook_user')
    setUser(null)
    // console.log('user logged out')
  }

  // on page load, if we have a token, double check with /auth/me that it is still valid
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('clinicbook_token')
      if (!token) return
      try {
        const res = await api.get('/auth/me')
        if (res.data.success) {
          const fresh = { ...res.data.user, token }
          localStorage.setItem('clinicbook_user', JSON.stringify(fresh))
          setUser(fresh)
        }
      } catch (err) {
        // invalid token, interceptor already cleared it
        console.log('session check failed', err.message)
      }
    }
    checkSession()
  }, [])

  return (
    <AuthContext.Provider value={{ user, saveSession, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
