import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div style={containerStyle}>
      <div style={heroSectionStyle}>
        <h1 style={titleStyle}>Cloud Code Compiler</h1>
        <p style={subtitleStyle}>
          A powerful online code compiler with AI-powered assistance, syntax help, and real-time execution for Python, JavaScript, C++, and Java.
        </p>
        <div style={buttonGroupStyle}>
          <Link to="/playground" style={primaryButtonStyle}>
            Start Coding Now
          </Link>
        </div>
      </div>

      <div style={featuresSectionStyle}>
        <h2 style={sectionTitleStyle}>Features</h2>
        <div style={featuresGridStyle}>
          <div style={featureCardStyle}>
            <h3 style={featureTitleStyle}>🚀 Multi-Language Support</h3>
            <p style={featureDescriptionStyle}>
              Write and execute code in Python, JavaScript, C++, and Java with syntax highlighting and error detection.
            </p>
          </div>
          <div style={featureCardStyle}>
            <h3 style={featureTitleStyle}>🤖 AI-Powered Assistance</h3>
            <p style={featureDescriptionStyle}>
              Get intelligent code suggestions, explanations, and debugging help powered by advanced AI models.
            </p>
          </div>
          <div style={featureCardStyle}>
            <h3 style={featureTitleStyle}>📚 Interactive Learning</h3>
            <p style={featureDescriptionStyle}>
              Practice with coding challenges, get hints, and learn through guided problem-solving experiences.
            </p>
          </div>
          <div style={featureCardStyle}>
            <h3 style={featureTitleStyle}>💡 Real-time Help</h3>
            <p style={featureDescriptionStyle}>
              Get instant syntax help, tooltips, and contextual guidance as you type your code.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

const containerStyle: React.CSSProperties = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '40px 32px',
  width: '100%'
}

const heroSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '80px 20px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '20px',
  color: 'white',
  marginBottom: '60px'
}

const titleStyle: React.CSSProperties = {
  fontSize: '3.5rem',
  fontWeight: 'bold',
  marginBottom: '20px',
  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  marginBottom: '40px',
  opacity: 0.9,
  maxWidth: '600px',
  margin: '0 auto 40px auto'
}

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
  flexWrap: 'wrap'
}

const primaryButtonStyle: React.CSSProperties = {
  padding: '15px 30px',
  background: 'white',
  color: '#667eea',
  textDecoration: 'none',
  borderRadius: '10px',
  fontWeight: 'bold',
  fontSize: '1.1rem',
  transition: 'transform 0.2s',
  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '15px 30px',
  background: 'transparent',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '10px',
  fontWeight: 'bold',
  fontSize: '1.1rem',
  border: '2px solid white',
  transition: 'all 0.2s'
}

const featuresSectionStyle: React.CSSProperties = {
  marginBottom: '60px'
}

const sectionTitleStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '2.5rem',
  marginBottom: '40px',
  color: '#f0f6fc'
}

const featuresGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '30px',
  marginTop: '40px'
}

const featureCardStyle: React.CSSProperties = {
  background: '#161b22',
  padding: '30px',
  borderRadius: '15px',
  boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
  textAlign: 'center',
  transition: 'transform 0.2s',
  border: '1px solid #30363d'
}

const featureTitleStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  marginBottom: '15px',
  color: '#f0f6fc'
}

const featureDescriptionStyle: React.CSSProperties = {
  color: '#8b949e',
  lineHeight: '1.6'
}

const ctaSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  background: '#f8f9fa',
  borderRadius: '20px'
}

const ctaTextStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  color: '#666',
  marginBottom: '40px',
  maxWidth: '600px',
  margin: '0 auto 40px auto'
}


