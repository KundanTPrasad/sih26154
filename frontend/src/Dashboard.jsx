import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from './api'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [sourceText, setSourceText] = useState('')
  const [advisory, setAdvisory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError('')
    setAdvisory(null)
    setLoading(true)
    try {
      const response = await api.post('/generate-advisory', {
        source_text: sourceText
      })
      setAdvisory(response.data)
    } catch (err) {
      setError('Failed to generate advisory. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="status-dot-small"></span>
          <span className="header-title">Advisory dashboard</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      <main className="dashboard-main">
        <p className="dashboard-eyebrow">Operator console</p>
        <h1>Generate an advisory</h1>
        <p className="dashboard-subtitle">
          Paste raw source content below — a report, incident summary, or threat intelligence.
        </p>

        <form onSubmit={handleGenerate} style={{ marginTop: '24px' }}>
          <textarea
            className="source-textarea"
            placeholder="Paste source content here..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            required
          />
          <button type="submit" className="generate-btn" disabled={loading}>
            {loading ? 'Generating...' : 'Generate advisory'}
          </button>
        </form>

        {error && <p className="dashboard-error">{error}</p>}
                {advisory && (
          <div className="advisory-card">
            <div className="advisory-card-header">
              <span className="advisory-ref">{advisory.reference}</span>
              <span className={`severity-badge severity-${advisory.severity.toLowerCase()}`}>
                {advisory.severity}
              </span>
            </div>
            <h2 className="advisory-subject">{advisory.subject}</h2>

            <div className="advisory-section">
              <p className="advisory-label">Summary</p>
              <p className="advisory-text">{advisory.summary}</p>
            </div>

            <div className="advisory-section">
              <p className="advisory-label">Affected parties</p>
              <p className="advisory-text">{advisory.affected_parties}</p>
            </div>

            <div className="advisory-section">
              <p className="advisory-label">Impact</p>
              <p className="advisory-text">{advisory.impact}</p>
            </div>

            <div className="advisory-section">
              <p className="advisory-label">Recommended actions</p>
              <ul className="advisory-actions">
                {advisory.recommended_actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard