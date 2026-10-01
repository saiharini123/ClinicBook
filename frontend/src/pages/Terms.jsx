import React from 'react'

// Terms of Service - generic Indian legal references, plain language
const Terms = () => {
  return (
    <div className="container mt-3">
      <div className="row justify-content-center">
        <div className="col-md-9">
          <h3>Terms of Service</h3>
          <p className="text-muted small">Last updated: 01-09-2026 · ClinicBook India Pvt Ltd</p>

          <div className="card card-clinic">
            <div className="card-body">
              <h6>1. About these terms</h6>
              <p className="small">
                ClinicBook India ("we", "our", "the platform") is an appointment booking
                facilitator for independent clinics and practitioners registered in India. By
                creating an account you agree to these terms, governed by the laws of India.
              </p>

              <h6>2. Medical disclaimer</h6>
              <p className="small">
                ClinicBook is <strong>not</strong> a medical service provider. We do not offer
                medical advice, diagnosis or treatment. All consultations, prescriptions and
                medical decisions are solely between you and your treating doctor. In a
                medical emergency, call <strong>108</strong> or visit the nearest hospital —
                do not wait for an online appointment.
              </p>

              <h6>3. Eligibility and accounts</h6>
              <p className="small">
                You must be at least 18 years old to create an account, or have consent from a
                parent/legal guardian. Family bookings made on behalf of minors or elders are
                the responsibility of the account holder. You agree to provide accurate
                details (name, mobile number, PIN code) and keep your password confidential.
              </p>

              <h6>4. Aadhaar and identity data</h6>
              <p className="small">
                Aadhaar submission is entirely <strong>optional</strong>. Where provided, we
                store only a masked reference (XXXX-XXXX-1234) for clinic reception
                verification, consistent with the Supreme Court's Puttaswamy judgment (2018)
                guidance on Aadhaar usage by private entities. We do not share it with third
                parties for marketing.
              </p>

              <h6>5. Payments, fees and GST</h6>
              <p className="small">
                Consultation fees are set by each doctor. A GST invoice is generated per
                booking under the clinic's GSTIN as per the CGST/SGST Act, 2017 (IGST for
                inter-state supply). UPI/Razorpay/Stripe transactions are processed by
                PCI-DSS compliant gateways; we do not store card details. Refunds for
                cancelled prepaid appointments are processed to the original payment method
                within 5-7 working days.
              </p>

              <h6>6. Cancellations and no-shows</h6>
              <p className="small">
                You may cancel an upcoming appointment from the platform at any time before
                your slot. Repeated no-shows may lead to token priority being reduced at
                clinics that enable this setting.
              </p>

              <h6>7. Doctors on the platform</h6>
              <p className="small">
                Doctors listed on ClinicBook declare their qualifications (MBBS/MD/DNB/BAMS/
                BHMS etc.) and statutory registration numbers (NMC / State Medical Council /
                CCIM). Listing does not constitute our endorsement. Report any
                misrepresentation to help@clinicbook.in.
              </p>

              <h6>8. Data protection</h6>
              <p className="small">
                We follow reasonable security practices under the Information Technology Act,
                2000 and the SPDI Rules, 2011. Health records shared with a doctor are used
                only for your treatment. You may request deletion of your account and data by
                writing to help@clinicbook.in.
              </p>

              <h6>9. Limitation of liability</h6>
              <p className="small">
                To the maximum extent permitted by law, ClinicBook's total liability for any
                claim is limited to the consultation fee of the appointment concerned.
              </p>

              <h6>10. Jurisdiction</h6>
              <p className="small">
                These terms are subject to the exclusive jurisdiction of courts at
                Bengaluru, Karnataka.
              </p>

              <hr />
              <p className="small text-muted">
                Questions? Email help@clinicbook.in or write to ClinicBook India Pvt Ltd,
                3rd Floor, Indiranagar Metro Building, 100 Feet Road, Bengaluru - 560038.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terms
