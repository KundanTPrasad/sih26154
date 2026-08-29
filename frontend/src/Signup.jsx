import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import './AuthForm.css'

function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://127.0.0.1:8000/signup', {
        name: name,
        email: email,
        password: password
      })
      setIsError(false)
      setMessage('Account created. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (error) {
      setIsError(true)
      setMessage(error.response.data.detail)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form-card">
        <p className="form-eyebrow">Operator registration</p>
        <h2>Create your account</h2>
        <p className="form-subtitle">Register to submit source content and generate advisories.</p>

        <form onSubmit={handleSignup}>
          <div className="field-group">
            <label className="field-label">Full name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">Create account</button>
        </form>

        {message && (
          <p className={`form-message ${isError ? 'error' : ''}`}>{message}</p>
        )}

        <p className="form-footer-link">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default Signup
