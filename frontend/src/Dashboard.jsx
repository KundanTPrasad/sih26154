import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
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
        <h1>Welcome, operator</h1>
        <p className="dashboard-subtitle">
          Advisory generation module coming next — source content input,
          output type selection, and distribution scope will live here.
        </p>
      </main>
    </div>
  )
}

export default Dashboard