import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { login } from '../../services/authApi'

type LoginFormState = {
  email: string
  password: string
}

export function Login() {
  const [form, setForm] = useState<LoginFormState>({ email: '', password: '' })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Enter a valid email')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    try {
      setLoading(true)
      await login(form.email, form.password)
      alert('Logged in!')
    } catch (err: any) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Login Form</h2>
        <div style={toggleRowStyle}>
          <button style={{ ...toggleBtnStyle, ...toggleActiveStyle }}>Login</button>
          <Link to="/signup" style={{ textDecoration: 'none' }}>
            <button style={toggleBtnStyle}>Signup</button>
          </Link>
        </div>
        {error && <div style={errorStyle}>{error}</div>}
        <form onSubmit={onSubmit}>
          <input
            style={inputStyle}
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div style={{ textAlign: 'right', marginBottom: 12 }}>
            <a href="#" style={{ color: '#2563eb', fontSize: 14 }}>Forgot password?</a>
          </div>
          <button disabled={loading} style={ctaButtonStyle}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ marginTop: 12, fontSize: 14 }}>
          Not a member?{' '}
          <Link to="/signup" style={{ color: '#2563eb' }}>Signup now</Link>
        </div>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  minHeight: '60vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#b6a8f2'
}

const cardStyle: React.CSSProperties = {
  width: 320,
  background: 'white',
  borderRadius: 12,
  padding: 24,
  boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 16,
  textAlign: 'center'
}

const toggleRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginBottom: 16
}

const toggleBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#fff',
  cursor: 'pointer'
}

const toggleActiveStyle: React.CSSProperties = {
  color: 'white',
  background: 'linear-gradient(90deg, #0ea5ea, #1453c5)',
  border: 'none'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  marginBottom: 12
}

const ctaButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 12px',
  borderRadius: 8,
  background: 'linear-gradient(90deg, #0ea5ea, #1453c5)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600
}

const errorStyle: React.CSSProperties = {
  background: '#fee2e2',
  color: '#991b1b',
  padding: '8px 12px',
  borderRadius: 8,
  marginBottom: 12,
  fontSize: 14
}


