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
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
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
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  lightbulb: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.55.6 2.87 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
    </svg>
  ),
  searchDoc: (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="11.5" cy="14.5" r="2.5" />
      <path d="M13.25 16.25L15 18" />
    </svg>
  ),
  sparkleOut: (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
      <path d="M19 16l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
    </svg>
  ),
  shieldCheck: (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  cloudUpload: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
      <path d="M12 13v-6" />
      <path d="M9 10l3-3 3 3" />
    </svg>
  ),
  circleCheck: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="16 9 10.5 15 8 12.5" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="6" x2="9" y2="6.01" />
      <line x1="15" y1="6" x2="15" y2="6.01" />
      <line x1="9" y1="10" x2="9" y2="10.01" />
      <line x1="15" y1="10" x2="15" y2="10.01" />
      <line x1="9" y1="14" x2="9" y2="14.01" />
      <line x1="15" y1="14" x2="15" y2="14.01" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  xCircle: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
}

const INDIAN_LANGUAGES = [
  { code: 'English', label: 'English', native: 'English' },
  { code: 'Hindi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'Bengali', label: 'Bengali', native: 'বাংলা' },
  { code: 'Tamil', label: 'Tamil', native: 'தமிழ்' },
  { code: 'Telugu', label: 'Telugu', native: 'తెలుగు' },
  { code: 'Marathi', label: 'Marathi', native: 'मराठी' },
  { code: 'Gujarati', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'Kannada', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'Malayalam', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'Punjabi', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'Odia', label: 'Odia', native: 'ଓଡ଼ିଆ' },
]

const AUDIENCE_LEVELS = [
  { id: 'system', label: 'System Level', sub: 'SOC & Tech Ops', icon: Icon.terminal },
  { id: 'organization', label: 'Organization Level', sub: 'Execs & State Agencies', icon: Icon.building },
  { id: 'people', label: 'People Level', sub: 'Public & Citizens', icon: Icon.users },
]

const OUTPUT_META = {
  advisory: { label: 'Advisory', desc: 'Detailed advisory with key findings', icon: Icon.doc },
  linkedin: { label: 'LinkedIn post', desc: 'Short, engaging post for LinkedIn', icon: Icon.linkedin },
  exec_summary: { label: 'Executive summary', desc: 'Concise summary for decision makers', icon: Icon.doc },
  action_plan: { label: 'Action plan', desc: 'Recommended actions and next steps', icon: Icon.plan },
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
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [audienceLevel, setAudienceLevel] = useState('organization')
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

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
    if (loading) return
    if (!fileInfo || !sourceText.trim()) {
      setError('Please upload an official document (PDF or Image) to generate analysis.')
      return
    }
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
        language: selectedLanguage,
        audience_level: audienceLevel,
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
  }, [sourceText, loading, selectedOutputs, uploadId, history, fileInfo, selectedLanguage, audienceLevel])

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

  return (
    <div className="workspace-shell">
      <header className="dashboard-header">
        <div className="header-left">
          <img src={transvexaMark} alt="Transvexa" className="dashboard-logo-img" />
          <div className="header-brand-group">
            <span className="header-brand-name">TRANSVEXA</span>
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
          <button
            className="header-icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            type="button"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? Icon.moon : Icon.sun}
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="workspace-body">
        <aside className="panel panel-source">
          <div className="panel-heading-row">
            <p className="panel-heading">SOURCE DOCUMENT</p>
            {fileInfo && (
              <button className="text-btn" onClick={handleClear} type="button">
                {Icon.clear}
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* File Upload Zone - shown when no file uploaded */}
          {!fileInfo ? (
            <div className="source-upload-section">
              <FileDropZone onFileProcessed={handleFileUpload} uploading={uploading} />

              <div className="source-compliance-notice">
                <div className="compliance-notice-header">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Official Document Ingestion Only</span>
                </div>
                <p className="compliance-notice-desc">
                  To ensure audit compliance and official verification, direct manual text input is disabled.
                </p>
                <div className="compliance-features">
                  <div className="compliance-item">
                    <span className="compliance-check-icon">{Icon.circleCheck}</span>
                    <span>Upload official incident reports, audit logs, or raw data captures.</span>
                  </div>
                  <div className="compliance-item">
                    <span className="compliance-check-icon">{Icon.circleCheck}</span>
                    <span>Supported formats: <strong>PDF, PNG, JPG, JPEG, WEBP</strong> (up to 10 MB).</span>
                  </div>
                  <div className="compliance-item">
                    <span className="compliance-check-icon">{Icon.circleCheck}</span>
                    <span>Data is extracted and processed directly by AI into selected official outputs.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="file-uploaded-container">
              <FileInfoCard fileInfo={fileInfo} onRemove={handleRemoveFile} />
              <div className="file-ready-notice">
                <div className="file-ready-badge">
                  <span className="file-ready-dot" />
                  <span>Document Verified & Ready</span>
                </div>
                <p className="file-ready-hint">
                  Raw data has been validated. Select your required output formats in the Outputs panel and click <strong>Generate</strong>.
                </p>
              </div>

              <button
                className="secondary-btn replace-file-btn"
                onClick={handleRemoveFile}
                type="button"
              >
                {Icon.upload}
                <span>Upload a different document</span>
              </button>
            </div>
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
            <div className="pro-empty-state">
              <div className="pro-empty-hero">
                <div className="pro-hero-circle">
                  <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor">
                    <rect x="18" y="12" width="28" height="38" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
                    <line x1="24" y1="20" x2="40" y2="20" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="24" y1="26" x2="40" y2="26" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="24" y1="32" x2="34" y2="32" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <div className="pro-hero-badge">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </div>
                </div>
              </div>

              <h2 className="pro-empty-title">Upload a document to get started</h2>
              <p className="pro-empty-subtitle">
                Our AI will analyze your document and generate the selected outputs on the right.
              </p>

              <div className="pro-features-grid">
                <div className="pro-feature-card">
                  <div className="pro-feature-icon">{Icon.searchDoc}</div>
                  <span className="pro-feature-text">Extract key information</span>
                </div>
                <div className="pro-feature-card">
                  <div className="pro-feature-icon">{Icon.sparkleOut}</div>
                  <span className="pro-feature-text">Generate structured outputs</span>
                </div>
                <div className="pro-feature-card">
                  <div className="pro-feature-icon">{Icon.shieldCheck}</div>
                  <span className="pro-feature-text">Support safer, data-driven decisions</span>
                </div>
              </div>

              <div className="pro-formats-section">
                <div className="pro-formats-divider">
                  <span>SUPPORTED FORMATS</span>
                </div>
                <div className="pro-formats-tags">
                  <span className="pro-tag">PDF</span>
                  <span className="pro-tag">PNG</span>
                  <span className="pro-tag">JPG</span>
                  <span className="pro-tag">JPEG</span>
                  <span className="pro-tag">WEBP</span>
                  <span className="pro-tag-sep">|</span>
                  <span className="pro-tag-hint">Max size: 10 MB</span>
                </div>
              </div>
            </div>
          )}

          {!showHistory && loading && (
            <div className="loading-state">
              <div className="loading-header">
                <span className="spinner spinner-dark" />
                <span>AI is analyzing document and generating outputs...</span>
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
                    <div className="advisory-ref-group">
                      <span className="advisory-ref">{advisory.reference}</span>
                      <span className={`level-pill-tag level-${audienceLevel}`}>
                        {audienceLevel === 'system' ? 'SOC / System' : audienceLevel === 'people' ? 'Public / Citizen' : 'Organization'}
                      </span>
                      {selectedLanguage !== 'English' && (
                        <span className="lang-pill-tag">{selectedLanguage}</span>
                      )}
                    </div>
                    <div className="advisory-card-actions">
                      <span className={`severity-badge severity-${(advisory.severity || 'high').toLowerCase()}`}>
                        {advisory.severity || 'HIGH'}
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
                      {advisory.recommended_actions?.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>

                  {/* ---------- Level 1: System Level Details ---------- */}
                  {advisory.technical_details && (
                    <div className="advisory-level-box system-box">
                      <div className="level-box-title">
                        {Icon.terminal}
                        <span>System Level Technical Intelligence</span>
                      </div>
                      {advisory.technical_details.cve_ids?.length > 0 && (
                        <div className="tech-meta-row">
                          <span className="tech-meta-label">CVE Identifiers:</span>
                          <div className="chips-wrap">
                            {advisory.technical_details.cve_ids.map((cve, i) => (
                              <span key={i} className="cve-chip">{cve}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {advisory.technical_details.mitre_attack?.length > 0 && (
                        <div className="tech-meta-row">
                          <span className="tech-meta-label">MITRE ATT&CK:</span>
                          <div className="chips-wrap">
                            {advisory.technical_details.mitre_attack.map((m, i) => (
                              <span key={i} className="mitre-chip">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {advisory.technical_details.iocs?.length > 0 && (
                        <div className="tech-meta-row">
                          <span className="tech-meta-label">Indicators of Compromise (IOCs):</span>
                          <div className="iocs-list">
                            {advisory.technical_details.iocs.map((ioc, i) => (
                              <code key={i} className="ioc-code">{ioc}</code>
                            ))}
                          </div>
                        </div>
                      )}
                      {advisory.technical_details.affected_ports && (
                        <div className="tech-meta-row">
                          <span className="tech-meta-label">Ports & Protocols:</span>
                          <span className="tech-meta-val">{advisory.technical_details.affected_ports}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ---------- Level 2: Organization Executive Breakdown ---------- */}
                  {advisory.executive_breakdown && (
                    <div className="advisory-level-box org-box">
                      <div className="level-box-title">
                        {Icon.building}
                        <span>Organization & Compliance Impact</span>
                      </div>
                      <div className="org-grid">
                        <div className="org-card">
                          <span className="org-card-label">Compliance Risk</span>
                          <span className="org-card-val">{advisory.executive_breakdown.compliance_risk}</span>
                        </div>
                        <div className="org-card">
                          <span className="org-card-label">Resource Requirement</span>
                          <span className="org-card-val">{advisory.executive_breakdown.resource_impact}</span>
                        </div>
                        <div className="org-card">
                          <span className="org-card-label">Action Urgency</span>
                          <span className="org-card-val">{advisory.executive_breakdown.urgency}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---------- Level 3: Citizen Guidelines ---------- */}
                  {advisory.citizen_guidelines && (
                    <div className="advisory-level-box people-box">
                      <div className="level-box-title">
                        {Icon.users}
                        <span>Citizen & Public Safety Guidelines</span>
                      </div>
                      <div className="dos-donts-grid">
                        {advisory.citizen_guidelines.dos?.length > 0 && (
                          <div className="dos-box">
                            <p className="dos-title">{Icon.circleCheck} Recommended Do's</p>
                            <ul>
                              {advisory.citizen_guidelines.dos.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {advisory.citizen_guidelines.donts?.length > 0 && (
                          <div className="donts-box">
                            <p className="donts-title">{Icon.xCircle} Crucial Don'ts</p>
                            <ul>
                              {advisory.citizen_guidelines.donts.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {advisory.citizen_guidelines.reporting_helpline && (
                        <div className="helpline-notice">
                          <span>Official Reporting Helpline / Portal: <strong>{advisory.citizen_guidelines.reporting_helpline}</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'action_plan' && actionPlan && (
                <div className="advisory-card">
                  <div className="advisory-card-header">
                    <div className="advisory-ref-group">
                      <span className="advisory-ref">Action Plan</span>
                      <span className="lang-pill-tag">{selectedLanguage}</span>
                    </div>
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
                    <p className="advisory-label" style={{ marginBottom: 0 }}>LinkedIn post ({selectedLanguage})</p>
                    <CopyButton text={secondaryResults.linkedin} />
                  </div>
                  <p className="advisory-text">{secondaryResults.linkedin}</p>
                </div>
              )}

              {activeTab === 'exec_summary' && secondaryResults.exec_summary && (
                <div className="secondary-card">
                  <div className="secondary-card-head">
                    <p className="advisory-label" style={{ marginBottom: 0 }}>Executive summary ({selectedLanguage})</p>
                    <CopyButton text={secondaryResults.exec_summary} />
                  </div>
                  <p className="advisory-text">{secondaryResults.exec_summary}</p>
                </div>
              )}
            </>
          )}
        </main>

        <aside className="panel panel-outputs">
          <p className="panel-heading">OUTPUT CONFIGURATION</p>

          {/* Regional Language Selector */}
          <div className="selector-group">
            <label className="selector-group-label">
              {Icon.globe}
              <span>TARGET REGIONAL LANGUAGE</span>
            </label>
            <select
              className="language-select-dropdown"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label} ({lang.native})
                </option>
              ))}
            </select>
          </div>

          {/* 3-Level Audience Selector */}
          <div className="selector-group">
            <label className="selector-group-label">
              <span>AUDIENCE DISTRIBUTION LEVEL</span>
            </label>
            <div className="audience-pills-list">
              {AUDIENCE_LEVELS.map((lvl) => {
                const isSelected = audienceLevel === lvl.id
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    className={`audience-pill-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setAudienceLevel(lvl.id)}
                  >
                    <span className="pill-icon">{lvl.icon}</span>
                    <div className="pill-info">
                      <span className="pill-title">{lvl.label}</span>
                      <span className="pill-sub">{lvl.sub}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <p className="panel-heading" style={{ marginTop: '16px' }}>FORMAT OUTPUTS</p>

          <div className="output-options-list">
            {Object.keys(OUTPUT_META).map((key) => {
              const isChecked = selectedOutputs[key]
              const meta = OUTPUT_META[key]
              return (
                <label className={`output-option-card ${isChecked ? 'selected' : ''}`} key={key}>
                  <div className="output-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setSelectedOutputs({ ...selectedOutputs, [key]: e.target.checked })}
                    />
                    <div className={`custom-checkbox ${isChecked ? 'checked' : ''}`}>
                      {isChecked && (
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="output-option-icon-box">{meta.icon}</div>
                  <div className="output-option-content">
                    <span className="output-option-title">{meta.label}</span>
                    <span className="output-option-desc">{meta.desc}</span>
                  </div>
                </label>
              )
            })}
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading || !fileInfo}
            title={!fileInfo ? 'Upload an official document to generate analysis' : ''}
          >
            {loading ? (
              <>
                <span className="spinner spinner-light" />
                <span>Generating {selectedLanguage}...</span>
              </>
            ) : (
              <>
                {Icon.cloudUpload}
                <span>{fileInfo ? `Run Analysis (${selectedLanguage})` : 'Upload Document to Run'}</span>
              </>
            )}
          </button>

          <div className="outputs-tip-box">
            <div className="tip-header">
              <div className="tip-icon">{Icon.lightbulb}</div>
              <span className="tip-title">Tip</span>
            </div>
            <p className="tip-text">
              Outputs will be generated natively in {selectedLanguage} tailored for {audienceLevel === 'system' ? 'SOC & Tech' : audienceLevel === 'people' ? 'Citizen Safety' : 'Executive/State'} audience.
            </p>
          </div>
        </aside>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default Dashboard