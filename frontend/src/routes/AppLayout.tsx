import { Link, Outlet, useLocation } from 'react-router-dom'

export function AppLayout() {
  const location = useLocation()
  
  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div style={containerStyle}>
      <nav style={navStyle}>
        <div style={navContainerStyle}>
          <div style={navLinksStyle}>
            <Link to="/" style={isActive('/') ? activeNavLinkStyle : navLinkStyle}>
              <span style={navIconStyle}>🏠</span>
              Home
            </Link>
            <Link to="/about" style={isActive('/about') ? activeNavLinkStyle : navLinkStyle}>
              <span style={navIconStyle}>ℹ️</span>
              About
            </Link>
            <Link to="/playground" style={isActive('/playground') ? activeNavLinkStyle : navLinkStyle}>
              <span style={navIconStyle}>⚡</span>
              Code
            </Link>
          </div>
          <Link to="/signup" style={getStartedButtonStyle}>
            Get Started
          </Link>
        </div>
      </nav>
      <Outlet />
    </div>
  )
}

// Styles
const containerStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  minHeight: '100vh',
  background: '#0d1117',
  color: '#c9d1d9'
}

const navStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1a1f2e 0%, #161b22 100%)',
  borderBottom: '2px solid #30363d',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  position: 'sticky',
  top: 0,
  zIndex: 100
}

const navContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 32px',
  maxWidth: '100%',
  margin: '0 auto'
}

const logoSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12
}

const logoBoxStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #1f6feb 0%, #0969da 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)'
}

const brandNameStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#f0f6fc',
  letterSpacing: 0.5,
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
}

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  alignItems: 'center'
}

const navLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 20px',
  borderRadius: 8,
  textDecoration: 'none',
  color: '#8b949e',
  fontSize: 15,
  fontWeight: 500,
  transition: 'all 0.2s',
  border: '1px solid transparent',
  letterSpacing: 0.3
}

const activeNavLinkStyle: React.CSSProperties = {
  ...navLinkStyle,
  background: 'linear-gradient(135deg, #1f6feb 0%, #0969da 100%)',
  color: '#ffffff',
  fontWeight: 600,
  boxShadow: '0 4px 12px rgba(31, 111, 235, 0.4)',
  border: '1px solid #1f6feb'
}

const navIconStyle: React.CSSProperties = {
  fontSize: 16
}

const getStartedButtonStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: 'linear-gradient(135deg, #2ea043 0%, #238636 100%)',
  color: 'white',
  textDecoration: 'none',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 15,
  transition: 'all 0.2s',
  boxShadow: '0 4px 12px rgba(35, 134, 54, 0.4)',
  letterSpacing: 0.3,
  border: 'none',
  cursor: 'pointer'
}


