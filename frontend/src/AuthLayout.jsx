import { useState, useEffect } from 'react'
import './AuthLayout.css'

function AuthLayout({ children }) {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <div className="auth-shell">
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
        {theme === 'light' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        )}
      </button>

      <div className="auth-card-wrapper fade-in-up">
        <div className="auth-branding-panel">
          <div className="branding-content">
            <div className="logo-container">
              <svg className="leaf-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.5 4.5C14.5 2 9.5 2 6 5C2.5 8 2 13 4 16L11 23C11.5 23.5 12.5 23.5 13 23L19.5 16.5C21.5 14.5 22 10.5 19.5 7.5L17.5 4.5Z" opacity="0.8"/>
                <path d="M12 23V5M12 12C14.5 12 17 9 17.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <h2>NTRO Advisory</h2>
            <p>Content intelligence platform</p>
            
            <div className="decorative-line"></div>
            
            <p className="branding-tagline">
              Smarter insights.<br />
              Stronger decisions.
            </p>
          </div>
          <div className="landscape-illustration"></div>
        </div>
        <div className="auth-form-panel">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
