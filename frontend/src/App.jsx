import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LangProvider } from './context/LangContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

// pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import DoctorList from './pages/DoctorList'
import DoctorDetails from './pages/DoctorDetails'
import BookAppointment from './pages/BookAppointment'
import MyAppointments from './pages/MyAppointments'
import AppointmentDetails from './pages/AppointmentDetails'
import PaymentPage from './pages/PaymentPage'
import Dashboard from './pages/Dashboard'
import DoctorQueue from './pages/DoctorQueue'
import AdminDoctors from './pages/AdminDoctors'
import Profile from './pages/Profile'
import Emergency from './pages/Emergency'
import Contact from './pages/Contact'
import Terms from './pages/Terms'

// App root - providers (router, auth, language) + routes
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
        <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <div className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctors" element={<DoctorList />} />
          <Route path="/doctors/:id" element={<DoctorDetails />} />
          <Route path="/doctors/:id/book" element={<BookAppointment />} />

          <Route path="/my-appointments" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <MyAppointments />
            </ProtectedRoute>
          } />
          <Route path="/appointments/:id" element={
            <ProtectedRoute>
              <AppointmentDetails />
            </ProtectedRoute>
          } />
          <Route path="/appointments/:id/pay" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PaymentPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/queue" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorQueue />
            </ProtectedRoute>
          } />
          <Route path="/admin/doctors" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDoctors />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />

          <Route path="*" element={
            <div className="container mt-5 text-center">
              <h2>404 - Page Not Found</h2>
              <p>The page you are looking for does not exist or was moved.</p>
              <Link to="/" className="btn btn-clinic">Go to Homepage</Link>
            </div>
          } />
        </Routes>
      </div>
      <Footer />
    </div>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
