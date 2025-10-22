export function About() {
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>About This Project</h1>
        <p style={subtitleStyle}>
          An online code compiler with AI assistance built for learning and quick prototyping.
        </p>
      </div>

      <div style={contentStyle}>
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>What is this?</h2>
          <p style={paragraphStyle}>
            This is a web-based code compiler that lets you write and run code directly in your browser. 
            No installation needed - just pick a language and start coding. The AI features help you learn 
            as you code by suggesting improvements and explaining errors.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Features</h2>
          <div style={featuresListStyle}>
            <div style={featureItemStyle}>
              <h3 style={featureTitleStyle}>4 Languages</h3>
              <p style={featureDescriptionStyle}>
                Python, JavaScript, C++, and Java - all with syntax highlighting.
              </p>
            </div>
            <div style={featureItemStyle}>
              <h3 style={featureTitleStyle}>AI Suggestions</h3>
              <p style={featureDescriptionStyle}>
                Get code improvement tips after running your code.
              </p>
            </div>
            <div style={featureItemStyle}>
              <h3 style={featureTitleStyle}>Instant Execution</h3>
              <p style={featureDescriptionStyle}>
                Run code right in your browser - no server delays.
              </p>
            </div>
            <div style={featureItemStyle}>
              <h3 style={featureTitleStyle}>Error Help</h3>
              <p style={featureDescriptionStyle}>
                AI explains what went wrong when your code breaks.
              </p>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Built With</h2>
          <div style={techGridStyle}>
            <div style={techCardStyle}>
              <h3 style={techTitleStyle}>Frontend</h3>
              <ul style={techListStyle}>
                <li>React + TypeScript</li>
                <li>CodeMirror 6</li>
                <li>Vite</li>
              </ul>
            </div>
            <div style={techCardStyle}>
              <h3 style={techTitleStyle}>Backend</h3>
              <ul style={techListStyle}>
                <li>FastAPI (Python)</li>
                <li>Uvicorn</li>
                <li>Docker</li>
              </ul>
            </div>
            <div style={techCardStyle}>
              <h3 style={techTitleStyle}>AI</h3>
              <ul style={techListStyle}>
                <li>Ollama (Local AI)</li>
                <li>Mistral 7B</li>
              </ul>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>How to Use</h2>
          <div style={stepsStyle}>
            <div style={stepStyle}>
              <div style={stepNumberStyle}>1</div>
              <div>
                <h3 style={stepTitleStyle}>Pick a Language</h3>
                <p style={stepDescriptionStyle}>Choose Python, JavaScript, C++, or Java</p>
              </div>
            </div>
            <div style={stepStyle}>
              <div style={stepNumberStyle}>2</div>
              <div>
                <h3 style={stepTitleStyle}>Write Code</h3>
                <p style={stepDescriptionStyle}>Use the editor with syntax highlighting</p>
              </div>
            </div>
            <div style={stepStyle}>
              <div style={stepNumberStyle}>3</div>
              <div>
                <h3 style={stepTitleStyle}>Click RUN</h3>
                <p style={stepDescriptionStyle}>Execute and see the output instantly</p>
              </div>
            </div>
            <div style={stepStyle}>
              <div style={stepNumberStyle}>4</div>
              <div>
                <h3 style={stepTitleStyle}>Get AI Help</h3>
                <p style={stepDescriptionStyle}>Check suggestions and tips on the right</p>
              </div>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Project Info</h2>
          <p style={paragraphStyle}>
            This is a final year project built to demonstrate web-based code compilation with AI integration. 
            The goal was to create a simple, fast tool for learning and testing code snippets without setting up 
            a local development environment.
          </p>
        </section>
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

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '60px',
  padding: '40px 20px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '20px',
  color: 'white'
}

const titleStyle: React.CSSProperties = {
  fontSize: '3rem',
  fontWeight: 'bold',
  marginBottom: '20px',
  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  opacity: 0.9,
  maxWidth: '600px',
  margin: '0 auto'
}

const contentStyle: React.CSSProperties = {
  lineHeight: '1.6'
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '50px',
  background: 'white',
  padding: '40px',
  borderRadius: '15px',
  boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '2rem',
  marginBottom: '20px',
  color: '#333',
  borderBottom: '3px solid #667eea',
  paddingBottom: '10px'
}

const paragraphStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  color: '#666',
  marginBottom: '20px'
}

const featuresListStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '30px',
  marginTop: '30px'
}

const featureItemStyle: React.CSSProperties = {
  padding: '20px',
  background: '#f8f9fa',
  borderRadius: '10px',
  border: '1px solid #e9ecef'
}

const featureTitleStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  marginBottom: '10px',
  color: '#333'
}

const featureDescriptionStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '1rem'
}

const techGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '30px',
  marginTop: '30px'
}

const techCardStyle: React.CSSProperties = {
  padding: '25px',
  background: '#f8f9fa',
  borderRadius: '10px',
  border: '1px solid #e9ecef'
}

const techTitleStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  marginBottom: '15px',
  color: '#333'
}

const techListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0
}

const stepsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '30px',
  marginTop: '30px'
}

const stepStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '15px',
  padding: '20px',
  background: '#f8f9fa',
  borderRadius: '10px',
  border: '1px solid #e9ecef'
}

const stepNumberStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  background: '#667eea',
  color: 'white',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '1.2rem',
  flexShrink: 0
}

const stepTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  marginBottom: '5px',
  color: '#333'
}

const stepDescriptionStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '0.9rem'
}


