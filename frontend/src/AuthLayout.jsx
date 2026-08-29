import './AuthLayout.css'

function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="status-strip">
          <span className="status-dot"></span>
          SECURE CHANNEL &nbsp;•&nbsp; NODE: BHOPAL-GOV-04
        </div>
        <div className="auth-panel-content">
          <p className="eyebrow">NTRO Advisory Platform</p>
          <h1>Content intelligence,<br />structured for action.</h1>
          <p className="panel-description">
            Convert raw intelligence into CERT-In formatted advisories,
            reshaped for the audience that needs to act on it.
          </p>
        </div>
        <div className="panel-footer">
          SIH26154 &nbsp;•&nbsp; Blockchain &amp; Cybersecurity
        </div>
      </div>
      <div className="auth-form-area">
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
