import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from './api'
import transvexaMark from './assets/transvexa-mark.png'
import './Dashboard.css'

const HISTORY_KEY = 'transvexa_history'
const MAX_HISTORY = 20

// ---------- tiny inline icon set (no extra deps) ----------
const Icon = {
  copy: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  clear: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  pdf: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  plan: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
}

const OUTPUT_META = {
  advisory: { label: 'Advisory', icon: Icon.doc },
  linkedin: { label: 'LinkedIn post', icon: Icon.linkedin },
  exec_summary: { label: 'Executive summary', icon: Icon.doc },
  action_plan: { label: 'Action plan', icon: Icon.plan },
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)))
  } catch {
    // storage unavailable — fail silently, history is a convenience only
  }
}

function formatAdvisoryAsText(advisory) {
  const lines = [
    `${advisory.reference}  [${advisory.severity}]`,
    advisory.subject,
    '',
    'SUMMARY',
    advisory.summary,
    '',
    'AFFECTED PARTIES',
    advisory.affected_parties,
    '',
    'IMPACT',
    advisory.impact,
    '',
    'RECOMMENDED ACTIONS',
    ...advisory.recommended_actions.map((a, i) => `${i + 1}. ${a}`),
  ]
  return lines.join('\n')
}

function formatActionPlanAsText(plan) {
  const lines = [
    `ACTION PLAN: ${plan.title}`,
    `Priority: ${plan.priority}`,
    `Timeline: ${plan.estimated_timeline}`,
    '',
    'IMMEDIATE ACTIONS',
    ...(plan.immediate_actions || []).map((a, i) => `  ${i + 1}. ${a.action} [${a.responsible}] — ${a.deadline}`),
    '',
    'SHORT-TERM ACTIONS',
    ...(plan.short_term_actions || []).map((a, i) => `  ${i + 1}. ${a.action} [${a.responsible}] — ${a.deadline}`),
    '',
    'LONG-TERM ACTIONS',
    ...(plan.long_term_actions || []).map((a, i) => `  ${i + 1}. ${a.action} [${a.responsible}] — ${a.deadline}`),
    '',
    'RESOURCES NEEDED',
    ...(plan.resources_needed || []).map((r, i) => `  ${i + 1}. ${r}`),
    '',
    'RISK IF NOT ADDRESSED',
    plan.risk_if_not_addressed || 'N/A',
  ]
  return lines.join('\n')
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard API unavailable; nothing further we can do here
    }
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <button className="icon-btn" onClick={handleCopy} type="button">
      {copied ? Icon.check : Icon.copy}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="advisory-card skeleton-card">
      <div className="skeleton-line skeleton-w40" />
      <div className="skeleton-line skeleton-w70 skeleton-lg" />
      <div className="skeleton-line skeleton-w100" />
      <div className="skeleton-line skeleton-w90" />
      <div className="skeleton-line skeleton-w60" />
    </div>
  )
}

// ---------- File Upload Drop Zone ----------
function FileDropZone({ onFileProcessed, uploading }) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileProcessed(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileProcessed(e.target.files[0])
    }
  }

  return (
    <div
      className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      {uploading ? (
        <div className="drop-zone-uploading">
          <span className="spinner" />
          <span>Processing document…</span>
        </div>
      ) : (
        <>
          <div className="drop-zone-icon">{Icon.upload}</div>
          <p className="drop-zone-text">
            Drop image or PDF here, or <span className="drop-zone-link">browse</span>
          </p>
          <p className="drop-zone-hint">
            PNG, JPG, WEBP, PDF — up to 10 MB
          </p>
        </>
      )}
    </div>
  )
}

// ---------- File Info Card ----------
function FileInfoCard({ fileInfo, onRemove }) {
  return (
    <div className="file-info-card">
      <div className="file-info-icon">
        {fileInfo.file_type === 'pdf' ? Icon.pdf : Icon.image}
      </div>
      <div className="file-info-details">
        <span className="file-info-name">{fileInfo.filename}</span>
        <span className="file-info-meta">
          {formatFileSize(fileInfo.file_size)}
          {fileInfo.file_type === 'pdf' && ` · ${fileInfo.page_count} page${fileInfo.page_count > 1 ? 's' : ''}`}
          {' · '}
          <span className="file-info-type-badge">{fileInfo.file_type.toUpperCase()}</span>
        </span>
      </div>
      <button className="icon-btn danger" onClick={onRemove} type="button" title="Remove file">
        {Icon.clear}
      </button>
    </div>
  )
}

// ---------- Action Plan Card ----------
function ActionPlanCard({ plan }) {
  const priorityClass = `priority-${(plan.priority || 'medium').toLowerCase()}`

  return (
    <div className="action-plan-card">
      <div className="action-plan-header">
        <h2 className="action-plan-title">{plan.title}</h2>
        <div className="action-plan-header-right">
          <span className={`priority-badge ${priorityClass}`}>{plan.priority}</span>
          <CopyButton text={formatActionPlanAsText(plan)} />
        </div>
      </div>

      <div className="action-plan-timeline-bar">
        <span className="timeline-label">Estimated timeline:</span>
        <span className="timeline-value">{plan.estimated_timeline}</span>
      </div>

      {plan.immediate_actions?.length > 0 && (
        <div className="action-plan-section">
          <div className="action-section-header">
            <span className="action-section-dot dot-critical" />
            <span className="action-section-title">Immediate Actions</span>
          </div>
          <div className="action-list">
            {plan.immediate_actions.map((a, i) => (
              <div key={i} className="action-item">
                <div className="action-item-main">
                  <span className="action-num">{i + 1}</span>
                  <span className="action-text">{a.action}</span>
                </div>
                <div className="action-item-meta">
                  <span className="action-responsible">{a.responsible}</span>
                  <span className="action-deadline">{a.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.short_term_actions?.length > 0 && (
        <div className="action-plan-section">
          <div className="action-section-header">
            <span className="action-section-dot dot-high" />
            <span className="action-section-title">Short-Term Actions</span>
          </div>
          <div className="action-list">
            {plan.short_term_actions.map((a, i) => (
              <div key={i} className="action-item">
                <div className="action-item-main">
                  <span className="action-num">{i + 1}</span>
                  <span className="action-text">{a.action}</span>
                </div>
                <div className="action-item-meta">
                  <span className="action-responsible">{a.responsible}</span>
                  <span className="action-deadline">{a.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.long_term_actions?.length > 0 && (
        <div className="action-plan-section">
          <div className="action-section-header">
            <span className="action-section-dot dot-medium" />
            <span className="action-section-title">Long-Term Actions</span>
          </div>
          <div className="action-list">
            {plan.long_term_actions.map((a, i) => (
              <div key={i} className="action-item">
                <div className="action-item-main">
                  <span className="action-num">{i + 1}</span>
                  <span className="action-text">{a.action}</span>
                </div>
                <div className="action-item-meta">
                  <span className="action-responsible">{a.responsible}</span>
                  <span className="action-deadline">{a.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.resources_needed?.length > 0 && (
        <div className="action-plan-section">
          <p className="advisory-label">Resources needed</p>
          <ul className="advisory-actions">
            {plan.resources_needed.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.risk_if_not_addressed && (
        <div className="action-plan-risk">
          <p className="advisory-label">Risk if not addressed</p>
          <p className="advisory-text risk-text">{plan.risk_if_not_addressed}</p>
        </div>
      )}
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [sourceText, setSourceText] = useState('')
  const [advisory, setAdvisory] = useState(null)
  const [actionPlan, setActionPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [selectedOutputs, setSelectedOutputs] = useState({
    advisory: true,
    linkedin: false,
    exec_summary: false,
    action_plan: false,
  })
  const [secondaryResults, setSecondaryResults] = useState({})
  const [activeTab, setActiveTab] = useState('advisory')
  const [history, setHistory] = useState(loadHistory)
  const [showHistory, setShowHistory] = useState(false)
  const [toast, setToast] = useState('')
  const [fileInfo, setFileInfo] = useState(null)
  const [uploadId, setUploadId] = useState(null)
  const textareaRef = useRef(null)

  const hasResults = Boolean(advisory || actionPlan || secondaryResults.linkedin || secondaryResults.exec_summary)

  const availableTabs = [
    advisory && 'advisory',
    actionPlan && 'action_plan',
    secondaryResults.linkedin && 'linkedin',
    secondaryResults.exec_summary && 'exec_summary',
  ].filter(Boolean)

  useEffect(() => {
    if (hasResults && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisory, actionPlan, secondaryResults])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  // ---------- File Upload Handler ----------
  const handleFileUpload = useCallback(async (file) => {
    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const data = response.data
      setFileInfo({
        filename: data.filename,
        file_type: data.file_type,
        file_size: data.file_size,
        page_count: data.page_count,
      })
      setUploadId(data.upload_id)
      setSourceText(data.extracted_text)
      setToast(`Uploaded "${data.filename}" successfully`)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to process file'
      setError(detail)
    } finally {
      setUploading(false)
    }
  }, [])

  // ---------- Generate using unified /analyze endpoint ----------
  const handleGenerate = useCallback(async () => {
    if (!sourceText.trim() || loading) return
    setError('')
    setAdvisory(null)
    setActionPlan(null)
    setSecondaryResults({})
    setLoading(true)

    const outputTypes = Object.keys(selectedOutputs).filter((k) => selectedOutputs[k])
    if (outputTypes.length === 0) {
      setError('Please select at least one output type.')
      setLoading(false)
      return
    }

    try {
      const response = await api.post('/analyze', {
        source_text: sourceText,
        output_types: outputTypes,
        upload_id: uploadId,
      })

      const { results, errors: genErrors } = response.data

      let advisoryData = null
      let actionPlanData = null
      const secondary = {}

      if (results.advisory) {
        advisoryData = results.advisory.content
        setAdvisory(advisoryData)
      }
      if (results.action_plan) {
        actionPlanData = results.action_plan.content
        setActionPlan(actionPlanData)
      }
      if (results.linkedin) {
        secondary.linkedin = results.linkedin.content
      }
      if (results.exec_summary) {
        secondary.exec_summary = results.exec_summary.content
      }
      setSecondaryResults(secondary)

      // Show errors for individual outputs that failed
      if (genErrors && Object.keys(genErrors).length > 0) {
        const failedTypes = Object.keys(genErrors).join(', ')
        setToast(`Some outputs failed: ${failedTypes}`)
      }

      // Save to local history
      const entry = {
        id: `${Date.now()}`,
        timestamp: Date.now(),
        sourceText,
        advisory: advisoryData,
        actionPlan: actionPlanData,
        secondaryResults: secondary,
        fileInfo,
      }
      const nextHistory = [entry, ...history].slice(0, MAX_HISTORY)
      setHistory(nextHistory)
      saveHistory(nextHistory)
    } catch (err) {
      setError('Failed to generate output. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [sourceText, loading, selectedOutputs, uploadId, history, fileInfo])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleGenerate()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleGenerate])

  const handleClear = () => {
    setSourceText('')
    setAdvisory(null)
    setActionPlan(null)
    setSecondaryResults({})
    setError('')
    setFileInfo(null)
    setUploadId(null)
    textareaRef.current?.focus()
  }

  const handleRemoveFile = () => {
    setFileInfo(null)
    setUploadId(null)
    setSourceText('')
  }

  const handleLoadHistoryItem = (item) => {
    setSourceText(item.sourceText)
    setAdvisory(item.advisory)
    setActionPlan(item.actionPlan || null)
    setSecondaryResults(item.secondaryResults || {})
    setFileInfo(item.fileInfo || null)
    setError('')
    setShowHistory(false)
  }

  const handleDeleteHistoryItem = (id, e) => {
    e.stopPropagation()
    const next = history.filter((h) => h.id !== id)
    setHistory(next)
    saveHistory(next)
  }

  const handleClearHistory = () => {
    setHistory([])
    saveHistory([])
  }

  const handleDownloadAdvisory = () => {
    if (!advisory) return
    const blob = new Blob([formatAdvisoryAsText(advisory)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${advisory.reference || 'advisory'}.txt`
    link.click()
    URL.revokeObjectURL(url)
    setToast('Advisory downloaded')
  }

  const handleDownloadActionPlan = () => {
    if (!actionPlan) return
    const blob = new Blob([formatActionPlanAsText(actionPlan)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `action-plan-${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
    setToast('Action plan downloaded')
  }

  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0
  const charCount = sourceText.length

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
        <div className="header-right">
          <button
            className={`header-icon-btn ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory((s) => !s)}
            type="button"
            title="Generation history"
          >
            {Icon.history}
            <span>History</span>
            {history.length > 0 && <span className="history-count">{history.length}</span>}
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="workspace-body">
        <aside className="panel panel-source">
          <div className="panel-heading-row">
            <p className="panel-heading">Source</p>
            {(sourceText || fileInfo) && (
              <button className="text-btn" onClick={handleClear} type="button">
                {Icon.clear}
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* File Upload Zone - shown when no file uploaded */}
          {!fileInfo && <FileDropZone onFileProcessed={handleFileUpload} uploading={uploading} />}

          {/* When a file is uploaded, show only the file details and ready notice (no extracted text tab/box) */}
          {fileInfo && (
            <div className="file-uploaded-container">
              <FileInfoCard fileInfo={fileInfo} onRemove={handleRemoveFile} />
              <div className="file-ready-notice">
                <div className="file-ready-badge">
                  <span className="file-ready-dot" />
                  <span>Document loaded & ready for analysis</span>
                </div>
                <p className="file-ready-hint">
                  Raw data has been ingested. Choose your output formats and click <strong>Generate</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Direct text input - only shown when no file is uploaded */}
          {!fileInfo && (
            <>
              <div className="source-divider">
                <span className="source-divider-text">Or paste text directly</span>
              </div>

              <textarea
                ref={textareaRef}
                className="source-textarea"
                placeholder="Paste raw incident, report, or threat intel text here..."
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
              <div className="source-meta">
                <span>{wordCount} words · {charCount} chars</span>
                <span className="kbd-hint"><kbd>⌘</kbd>+<kbd>Enter</kbd> to generate</span>
              </div>
            </>
          )}
        </aside>

        <main className="panel panel-center">
          {showHistory && (
            <div className="history-panel">
              <div className="history-panel-head">
                <p className="panel-heading" style={{ marginBottom: 0 }}>Recent generations</p>
                {history.length > 0 && (
                  <button className="text-btn" onClick={handleClearHistory} type="button">Clear all</button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="empty-text">No generations yet. Your history will appear here.</p>
              ) : (
                <ul className="history-list">
                  {history.map((item) => (
                    <li key={item.id} className="history-item" onClick={() => handleLoadHistoryItem(item)}>
                      <div className="history-item-main">
                        <span className="history-item-title">
                          {item.advisory?.subject || item.actionPlan?.title || item.sourceText.slice(0, 60) || 'Untitled'}
                        </span>
                        <span className="history-item-time">{timeAgo(item.timestamp)}</span>
                      </div>
                      <div className="history-item-sub">
                        {item.advisory && (
                          <span className={`severity-badge severity-${item.advisory.severity.toLowerCase()}`}>
                            {item.advisory.severity}
                          </span>
                        )}
                        {item.actionPlan && <span className="mini-tag">Action plan</span>}
                        {item.secondaryResults?.linkedin && <span className="mini-tag">LinkedIn</span>}
                        {item.secondaryResults?.exec_summary && <span className="mini-tag">Exec summary</span>}
                        {item.fileInfo && (
                          <span className="mini-tag file-tag">
                            {item.fileInfo.file_type === 'pdf' ? '📄' : '🖼'} {item.fileInfo.filename}
                          </span>
                        )}
                        <button
                          className="icon-btn danger"
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          type="button"
                          title="Delete"
                        >
                          {Icon.trash}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!showHistory && !hasResults && !loading && (
            <div className="empty-state">
              <div className="empty-state-icon">{Icon.spark}</div>
              <p className="panel-heading">Generated output</p>
              <p className="empty-text">Upload a file or paste source content and select output types to begin.</p>
            </div>
          )}

          {!showHistory && loading && (
            <div className="loading-state">
              <div className="loading-header">
                <span className="spinner" />
                <span>Generating output…</span>
              </div>
              <SkeletonCard />
            </div>
          )}

          {!showHistory && error && <p className="dashboard-error">{error}</p>}

          {!showHistory && hasResults && (
            <>
              <div className="result-tabs">
                {availableTabs.map((tab) => (
                  <button
                    key={tab}
                    className={`result-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    type="button"
                  >
                    {OUTPUT_META[tab].icon}
                    <span>{OUTPUT_META[tab].label}</span>
                  </button>
                ))}
              </div>

              {activeTab === 'advisory' && advisory && (
                <div className="advisory-card">
                  <div className="advisory-card-header">
                    <span className="advisory-ref">{advisory.reference}</span>
                    <div className="advisory-card-actions">
                      <span className={`severity-badge severity-${advisory.severity.toLowerCase()}`}>
                        {advisory.severity}
                      </span>
                      <CopyButton text={formatAdvisoryAsText(advisory)} />
                      <button className="icon-btn" onClick={handleDownloadAdvisory} type="button">
                        {Icon.download}
                        <span>Export</span>
                      </button>
                    </div>
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

              {activeTab === 'action_plan' && actionPlan && (
                <div className="advisory-card">
                  <div className="advisory-card-header">
                    <span className="advisory-ref">Action Plan</span>
                    <div className="advisory-card-actions">
                      <CopyButton text={formatActionPlanAsText(actionPlan)} />
                      <button className="icon-btn" onClick={handleDownloadActionPlan} type="button">
                        {Icon.download}
                        <span>Export</span>
                      </button>
                    </div>
                  </div>
                  <ActionPlanCard plan={actionPlan} />
                </div>
              )}

              {activeTab === 'linkedin' && secondaryResults.linkedin && (
                <div className="secondary-card">
                  <div className="secondary-card-head">
                    <p className="advisory-label" style={{ marginBottom: 0 }}>LinkedIn post</p>
                    <CopyButton text={secondaryResults.linkedin} />
                  </div>
                  <p className="advisory-text">{secondaryResults.linkedin}</p>
                </div>
              )}

              {activeTab === 'exec_summary' && secondaryResults.exec_summary && (
                <div className="secondary-card">
                  <div className="secondary-card-head">
                    <p className="advisory-label" style={{ marginBottom: 0 }}>Executive summary</p>
                    <CopyButton text={secondaryResults.exec_summary} />
                  </div>
                  <p className="advisory-text">{secondaryResults.exec_summary}</p>
                </div>
              )}
            </>
          )}
        </main>

        <aside className="panel panel-outputs">
          <p className="panel-heading">Outputs</p>

          {Object.keys(OUTPUT_META).map((key) => (
            <label className="output-option" key={key}>
              <input
                type="checkbox"
                checked={selectedOutputs[key]}
                onChange={(e) => setSelectedOutputs({ ...selectedOutputs, [key]: e.target.checked })}
              />
              <span className="output-option-icon">{OUTPUT_META[key].icon}</span>
              <span>{OUTPUT_META[key].label}</span>
            </label>
          ))}

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading || !sourceText.trim()}
          >
            {loading ? (
              <>
                <span className="spinner spinner-dark" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
        </aside>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default Dashboard