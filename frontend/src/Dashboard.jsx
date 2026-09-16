import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from './api'
import transvexaMark from './assets/transvexa-mark.png'
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

  const handleGenerate = async () => {
    setError('')
    setAdvisory(null)
    setSecondaryResults({})
    setLoading(true)

    try {
      if (selectedOutputs.advisory) {
        const response = await api.post('/generate-advisory', { source_text: sourceText })
        setAdvisory(response.data)
      }
      const results = {}
      if (selectedOutputs.linkedin) {
        const res = await api.post('/generate-secondary', { source_text: sourceText, output_type: 'linkedin' })
        results.linkedin = res.data.content
      }
      if (selectedOutputs.exec_summary) {
        const res = await api.post('/generate-secondary', { source_text: sourceText, output_type: 'exec_summary' })
        results.exec_summary = res.data.content
      }
      setSecondaryResults(results)
    } catch (err) {
      setError('Failed to generate output. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasResults = advisory || secondaryResults.linkedin || secondaryResults.exec_summary

  return (
    <div className="workspace-shell">
      <header className="dashboard-header">
        <div className="header-left">
          <img src={transvexaMark} alt="Transvexa" className="dashboard-logo-img" />
          <div className="header-brand-group">
            <span className="header-brand-name">TRANSVEXA</span>
            <span className="header-brand-badge">Advisory</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>

      <div className="workspace-body">
        <aside className="panel panel-source">
          <p className="panel-heading">Source</p>
          <textarea
            className="source-textarea"
            placeholder="Paste raw incident, report, or threat intel text here..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
        </aside>

        <main className="panel panel-center">
          {!hasResults && !loading && (
            <div className="empty-state">
              <p className="panel-heading">Generated output</p>
              <p className="empty-text">Paste source content and select output types to begin.</p>
            </div>
          )}

          {loading && <p className="empty-text">Generating...</p>}

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

        <aside className="panel panel-outputs">
          <p className="panel-heading">Outputs</p>

          <label className="output-option">
            <input
              type="checkbox"
              checked={selectedOutputs.advisory}
              onChange={(e) => setSelectedOutputs({ ...selectedOutputs, advisory: e.target.checked })}
            />
            <span>Advisory</span>
          </label>
          <label className="output-option">
            <input
              type="checkbox"
              checked={selectedOutputs.linkedin}
              onChange={(e) => setSelectedOutputs({ ...selectedOutputs, linkedin: e.target.checked })}
            />
            <span>LinkedIn post</span>
          </label>
          <label className="output-option">
            <input
              type="checkbox"
              checked={selectedOutputs.exec_summary}
              onChange={(e) => setSelectedOutputs({ ...selectedOutputs, exec_summary: e.target.checked })}
            />
            <span>Executive summary</span>
          </label>

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading || !sourceText.trim()}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </aside>
      </div>
    </div>
  )
}

export default Dashboard