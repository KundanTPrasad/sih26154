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
  const [selectedOutputs, setSelectedOutputs] = useState({
    advisory: true,
    linkedin: false,
    exec_summary: false
  })
  const [secondaryResults, setSecondaryResults] = useState({})

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError('')
    setAdvisory(null)
    setSecondaryResults({})
    setLoading(true)

    try {
      if (selectedOutputs.advisory) {
        const response = await api.post('/generate-advisory', {
          source_text: sourceText
        })
        setAdvisory(response.data)
      }

      const results = {}
      if (selectedOutputs.linkedin) {
        const res = await api.post('/generate-secondary', {
          source_text: sourceText,
          output_type: 'linkedin'
        })
        results.linkedin = res.data.content
      }
      if (selectedOutputs.exec_summary) {
        const res = await api.post('/generate-secondary', {
          source_text: sourceText,
          output_type: 'exec_summary'
        })
        results.exec_summary = res.data.content
      }
      setSecondaryResults(results)
    } catch (err) {
      setError('Failed to generate output. Please try again.')
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

          <div className="output-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={selectedOutputs.advisory}
                onChange={(e) => setSelectedOutputs({ ...selectedOutputs, advisory: e.target.checked })}
              />
              Advisory
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedOutputs.linkedin}
                onChange={(e) => setSelectedOutputs({ ...selectedOutputs, linkedin: e.target.checked })}
              />
              LinkedIn post
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedOutputs.exec_summary}
                onChange={(e) => setSelectedOutputs({ ...selectedOutputs, exec_summary: e.target.checked })}
              />
              Executive summary
            </label>
          </div>

          <button type="submit" className="generate-btn" disabled={loading}>
            {loading ? 'Generating...' : 'Generate'}
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

        {secondaryResults.linkedin && (
          <div className="secondary-card">
            <p className="advisory-label">LinkedIn post</p>
            <p className="advisory-text">{secondaryResults.linkedin}</p>
          </div>
        )}

        {secondaryResults.exec_summary && (
          <div className="secondary-card">
            <p className="advisory-label">Executive summary</p>
            <p className="advisory-text">{secondaryResults.exec_summary}</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard