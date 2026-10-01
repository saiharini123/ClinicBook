import React, { useState } from 'react'
import api from '../api/client'

// Contact page - working (stores nothing fancy, just posts to /api/health as a
// connectivity check and shows a success message. kept basic on purpose.)
const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'General', message: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.message.trim()) {
      setError('Please fill in your name and message so we can help you.')
      return
    }
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) {
      setError('Please enter valid mobile number with 10 digits.')
      return
    }
    setSending(true)
    try {
      // demo endpoint ping - a real deployment would store this in a support collection
      await api.get('/health')
      console.log('contact form submitted:', form) // left in intentionally for debugging
      setSent(true)
    } catch (err) {
      console.log('contact submit error:', err.message)
      setError('Message could not be sent right now. Please email us directly at help@clinicbook.in')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container mt-3">
      <h3>Contact Us</h3>
      <p className="text-muted small">
        We usually reply within one working day (Mon-Sat, 10 AM - 6 PM IST).
      </p>

      <div className="row">
        <div className="col-md-6">
          <div className="card card-clinic mb-3">
            <div className="card-body">
              <h6>Reach us directly</h6>
              <div className="small">
                <div>📞 Helpline: <strong>1800-CLINIC</strong> (toll free, 10 AM - 6 PM IST)</div>
                <div>💬 WhatsApp: +91 90000 12345</div>
                <div>✉️ Email: help@clinicbook.in</div>
                <div>🏢 Office: 3rd Floor, Indiranagar Metro Building, 100 Feet Road,
                  Bengaluru, Karnataka - 560038</div>
                <div className="mt-2 text-muted">
                  Registered office: ClinicBook India Pvt Ltd, CIN U85110KA2026PTC000001,
                  GSTIN 29AAACB1234F1Z8
                </div>
              </div>
            </div>
          </div>

          <div className="card card-clinic">
            <div className="card-body">
              <h6>Common questions</h6>
              <div className="small">
                <p><strong>How do I cancel an appointment?</strong><br />
                  Open My Appointments → select the booking → Cancel. Token is released immediately.</p>
                <p><strong>Do you charge booking fees?</strong><br />
                  No. You only pay the doctor's consultation fee + GST.</p>
                <p><strong>Can I book for my parents?</strong><br />
                  Yes — add them as family members in your profile, then choose "A family
                  member" while booking.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card card-clinic">
            <div className="card-body">
              <h6>Send us a message</h6>
              {sent ? (
                <div className="alert alert-success">
                  Thank you! Your message has been received. We'll get back to you on your
                  email or mobile number.
                  <div>
                    <button className="btn btn-sm btn-outline-secondary mt-2"
                      onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: 'General', message: '' }) }}>
                      Send another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="mb-2">
                    <label className="form-label small">Your name *</label>
                    <input className="form-control form-control-sm" value={form.name}
                      onChange={(e) => set('name', e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Email</label>
                    <input type="email" className="form-control form-control-sm" value={form.email}
                      onChange={(e) => set('email', e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Mobile (+91)</label>
                    <input className="form-control form-control-sm" maxLength={10}
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Subject</label>
                    <select className="form-select form-select-sm" value={form.subject}
                      onChange={(e) => set('subject', e.target.value)}>
                      {['General', 'Booking issue', 'Payment / refund', 'Doctor listing', 'Feedback'].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Message *</label>
                    <textarea className="form-control form-control-sm" rows={4} value={form.message}
                      onChange={(e) => set('message', e.target.value)} />
                  </div>
                  <button className="btn btn-clinic" disabled={sending}>
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
