import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import './AuthForm.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://127.0.0.1:8000/login', {
        email: email,
        password: password
      })
      localStorage.setItem('token', response.data.access_token)
      setIsError(false)
      setMessage('Login successful.')
    } catch (error) {
      setIsError(true)
      setMessage(error.response.data.detail)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form-card">
        <p className="form-eyebrow">Operator sign in</p>
        <h2>Welcome back</h2>
        <p className="form-subtitle">Sign in to access the advisory dashboard.</p>

        <form onSubmit={handleLogin}>
          <div className="field-group">
            <label className="field-label">Email</label>
            <input
              type="email"
              placeholder="you@department.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field-group">
            <label className="field-label">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">Sign in</button>
        </form>

        {message && (
          <p className={`form-message ${isError ? 'error' : ''}`}>{message}</p>
        )}

        <p className="form-footer-link">
          Don't have an account? <Link to="/signup">Register here</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default Login
