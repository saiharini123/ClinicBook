import React from 'react'
import { Link } from 'react-router-dom'

// simple footer with ClinicBook India branding
const Footer = () => {
  return (
    <footer className="footer-clinic">
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <strong>ClinicBook India</strong>
            <p className="mb-0">
              Book doctor appointments at clinics across India. Bengaluru · Mumbai · Delhi ·
              Chennai · Hyderabad and more.
            </p>
          </div>
          <div className="col-md-3">
            <strong>Quick Links</strong>
            <ul className="list-unstyled mb-0">
              <li><Link to="/doctors">Find Doctors</Link></li>
              <li><Link to="/emergency">Emergency / 108</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
          <div className="col-md-3">
            <strong>Support</strong>
            <ul className="list-unstyled mb-0">
              <li>Helpline: 1800-CLINIC (toll free)</li>
              <li>WhatsApp: +91 90000 12345</li>
              <li>Email: help@clinicbook.in</li>
            </ul>
          </div>
          <div className="col-md-2">
            <strong>Legal</strong>
            <ul className="list-unstyled mb-0">
              <li>GSTIN: 29AAACB1234F1Z8</li>
              <li>CIN: U85110KA2026PTC000001</li>
              <li>ISO 27001 (applied)</li>
            </ul>
          </div>
        </div>
        <hr className="border-secondary" />
        <div className="text-center">
          © {new Date().getFullYear()} ClinicBook India Pvt Ltd. All rights reserved.
          {' '}Prices shown in ₹ INR. Made in India 🇮🇳
        </div>
      </div>
    </footer>
  )
}

export default Footer
