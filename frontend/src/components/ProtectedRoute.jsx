import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Route guard. Pass allowedRoles like ['admin'] to restrict by role.
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          Sorry, this page is only for {allowedRoles.join(' / ')} accounts. You are logged in
          as <strong>{user.role}</strong>.
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
