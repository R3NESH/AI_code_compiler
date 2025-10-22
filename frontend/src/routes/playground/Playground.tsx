import { useEffect, useMemo, useState, useRef } from 'react'
import { executeCode } from '../../services/executeApi'
import { aiSuggest, aiExplain } from '../../services/aiApi'
import { recommend } from '../../services/recommendApi'
import { CodeEditor } from '../../components/CodeEditor'

type Language = 'python' | 'javascript' | 'cpp' | 'java'

type FileTab = {
  id: string
  name: string
  content: string
}

const languageStarter: Record<Language, string> = {
  python: 'print("Hello, World!")',
  javascript: 'console.log("Hello, World!")',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main(){ cout<<"Hello, World!"; }',
  java: 'public class Main {\n  public static void main(String[] args){\n    System.out.println("Hello, World!");\n  }\n}'
}

export function Playground() {
  const [language, setLanguage] = useState<Language>('python')
  const [stdin, setStdin] = useState('')
  const [tabs, setTabs] = useState<FileTab[]>([{
    id: 'main',
    name: 'main.py',
    content: languageStarter['python']
  }])
  const [activeId, setActiveId] = useState<string>('main')
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState('Click RUN button to execute your code')
  const [aiOpen, setAiOpen] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiData, setAiData] = useState<{ 
    suggestions: string[]; 
    explanation?: string; 
    qualityNotes?: string[]; 
    variables?: string[];
    problemUnderstanding?: string;
    bestApproach?: string;
    algorithmName?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    whyThisApproach?: string;
  }>({ suggestions: [] })
  const [errorExplanation, setErrorExplanation] = useState<{
    beginnerExplanation?: string;
    whyItHappened?: string;
    howToFix?: string[];
    proTip?: string;
  }>({})
  const [links, setLinks] = useState<{ title: string; url: string; source?: string; description?: string; difficulty?: string }[]>([])
  const [youtubeLinks, setYoutubeLinks] = useState<{ title: string; url: string; description?: string }[]>([])
  const [gfgLinks, setGfgLinks] = useState<{ title: string; url: string; description?: string; difficulty?: string }[]>([])
  const [leetcodeLinks, setLeetcodeLinks] = useState<{ title: string; url: string; description?: string; difficulty?: string }[]>([])
  const [striverLinks, setStriverLinks] = useState<{ title: string; url: string; description?: string; difficulty?: string }[]>([])
  const [hackerrankLinks, setHackerrankLinks] = useState<{ title: string; url: string; description?: string; difficulty?: string }[]>([])
  const [expandedSections, setExpandedSections] = useState({
    problemUnderstanding: true,
    bestApproach: true,
    suggestions: true,
    youtube: true,
    practice: true,
    error: true,
    output: true
  })
  const [error, setError] = useState<string>('')
  const [connectionError, setConnectionError] = useState(false)
  const [lastRunCode, setLastRunCode] = useState<string>('')
  const [editorWidth, setEditorWidth] = useState(60) // percentage - default 60% for better code visibility
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeTab = useMemo(
    () => tabs.find(t => t.id === activeId)!,
    [tabs, activeId]
  )

  const onLanguageChange = (lang: Language) => {
    setLanguage(lang)
    const ext = lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : lang === 'java' ? 'java' : 'cpp'
    setTabs([{ id: 'main', name: `main.${ext}`, content: languageStarter[lang] }])
    setActiveId('main')
  }

  const onEdit = (val: string) => {
    setTabs(prev => prev.map(t => t.id === activeId ? { ...t, content: val } : t))
  }

  const run = async () => {
    setRunning(true)
    setOutput('Running...')
    setError('')
    setConnectionError(false)
    setLastRunCode(activeTab.content)
    
    try {
      const res = await executeCode({ language, code: activeTab.content, stdin, trace: false })
      
      if (res.stderr) {
        setOutput(res.stderr)
        setError('Execution Error')
        // Ask AI to explain the error
        try {
          const ai = await aiExplain(language, activeTab.content, res.stderr)
          setAiData({ suggestions: ai.lineFixes || [], explanation: ai.summary, qualityNotes: ai.walkthrough, variables: [] })
          setErrorExplanation({
            beginnerExplanation: ai.beginnerExplanation,
            whyItHappened: ai.whyItHappened,
            howToFix: ai.howToFix,
            proTip: ai.proTip
          })
        } catch (aiError) {
          console.warn('AI explanation failed:', aiError)
        }
      } else {
        setOutput(res.output || 'Code executed successfully (no output)')
        setError('')
        // Get AI suggestions after successful run
        try {
          setAiLoading(true)
          console.log('[DEBUG] Fetching AI suggestions...')
          const aiRes = await aiSuggest({ language, code: activeTab.content, goal: 'assist coding', hints: detectAlgorithms(activeTab.content) })
          console.log('[DEBUG] AI Response:', aiRes)
          setAiData(aiRes)
          setErrorExplanation({}) // Clear error explanation on success
          
          // Get resource recommendations based on detected algorithm
          const topic = aiRes.algorithmName || detectAlgorithms(activeTab.content)[0] || language
          console.log('[DEBUG] Fetching recommendations for topic:', topic)
          const recs = await recommend(topic, language)
          console.log('[DEBUG] Recommendations:', recs)
          setLinks(recs.items || [])
          setYoutubeLinks(recs.youtubeVideos || [])
          setGfgLinks(recs.geeksforgeeks || [])
          setLeetcodeLinks(recs.leetcode || [])
          setStriverLinks(recs.striverSheet || [])
          setHackerrankLinks(recs.hackerrank || [])
        } catch (aiError) {
          console.error('[DEBUG] AI suggestions failed:', aiError)
        } finally {
          setAiLoading(false)
        }
      }
    } catch (e: any) {
      const errorMessage = e?.message ?? 'Failed to execute'
      setOutput(`❌ Error: ${errorMessage}`)
      setError('Connection Error')
      setConnectionError(true)
      
      // Check if it's a network error
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
        setOutput('❌ Connection Error: Unable to connect to the backend server.\n\nPlease ensure:\n1. Backend server is running on http://localhost:8000\n2. No firewall is blocking the connection\n3. Try refreshing the page')
      }
    } finally {
      setRunning(false)
    }
  }

  // AI suggestions are now only fetched when user clicks RUN
  // No automatic suggestions on mount or language change

  // Handle resizing
  const handleMouseDown = () => {
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      
      // Constrain between 40% and 75% for better flexibility
      if (newWidth >= 40 && newWidth <= 75) {
        setEditorWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div style={rootStyle}>
      <header style={headerStyle}>
        <div style={headerLeftStyle}>
          <div style={logoContainerStyle}>
            <div style={logoIconStyle}>💻</div>
          </div>
          <div style={headerTextContainerStyle}>
            <div style={titleStyle}>Code Compiler</div>
            <div style={subtitleStyle}>Write, Compile and run your code</div>
          </div>
        </div>
        <div style={headerRightStyle}>
          <div style={languageSelectorContainerStyle}>
            <span style={languageLabelStyle}>Language:</span>
            <select value={language} onChange={(e) => onLanguageChange(e.target.value as Language)} style={selectStyle}>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>
          <button onClick={run} disabled={running} style={{...runBtnStyle, ...(running ? runBtnDisabledStyle : {})}}>
            <span style={{ marginRight: 8, fontSize: 14 }}>▶</span>
            {running ? 'RUNNING...' : 'RUN'}
          </button>
        </div>
      </header>

      <div style={mainContainerStyle} ref={containerRef}>
        {/* Left Panel - Code Editor + Output */}
        <section style={{ ...editorPanelStyle, width: `${editorWidth}%` }}>
          {/* Code Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '60%', borderBottom: '1px solid #21262d' }}>
            <div style={panelHeaderWithIconStyle}>
              <span style={iconStyle}>📄</span>
              <span style={panelTitleStyle}>Code Editor</span>
              <span style={languageBadgeStyle}>{language}</span>
              <div style={macButtonsStyle}>
                <div style={{ ...macButtonStyle, background: '#ff5f56' }}></div>
                <div style={{ ...macButtonStyle, background: '#ffbd2e' }}></div>
                <div style={{ ...macButtonStyle, background: '#27c93f' }}></div>
              </div>
            </div>
            <div style={{ flex: 1, background: '#0d1117', overflow: 'hidden' }}>
              <CodeEditor value={activeTab.content} language={language} onChange={onEdit} />
            </div>
          </div>

          {/* Output Section */}
          <div style={{ height: '40%', display: 'flex', flexDirection: 'column' }}>
            <div style={collapsibleHeaderStyle} onClick={() => toggleSection('output')}>
              <span style={iconStyle}>🖥️</span>
              <span style={panelTitleStyle}>Output</span>
              <span style={expandIconStyle}>{expandedSections.output ? '▼' : '▶'}</span>
            </div>
            {expandedSections.output && (
              <div style={{ ...outputContainerStyle, flex: 1 }}>
                <pre style={{...outputTextStyle, ...(error ? errorOutputStyle : {})}}>
                  {output || 'Run your code to see the output...'}
                </pre>
                {connectionError && (
                  <div style={connectionErrorStyle}>
                    <div style={errorTitleStyle}>⚠️ Connection Error</div>
                    <div style={errorMessageStyle}>
                      Unable to connect to the backend server. Please check:
                      <ul style={errorListStyleOld}>
                        <li>Backend server is running on http://localhost:8000</li>
                        <li>No firewall is blocking the connection</li>
                        <li>Try refreshing the page</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Resizable Divider */}
        <div 
          style={dividerStyle(isResizing)} 
          onMouseDown={handleMouseDown}
        >
          <div style={dividerHandleStyle}></div>
        </div>

        {/* Right Panel - AI Features Only */}
        <section style={{ ...rightPanelContainerStyle, width: `${100 - editorWidth}%` }}>
          
          {/* AI Analysis Status - Always visible after running code */}
          {lastRunCode && (
            <div style={aiSectionStyle}>
              <div style={collapsibleHeaderStyle} onClick={() => toggleSection('suggestions')}>
                <span style={iconStyle}>🤖</span>
                <span style={panelTitleStyle}>AI Analysis</span>
                <span style={expandIconStyle}>{expandedSections.suggestions ? '▼' : '▶'}</span>
              </div>
              {expandedSections.suggestions && (
                <div style={aiContentStyle}>
                  {aiLoading ? (
                    <div style={loadingStyle}>🔄 Analyzing your code...</div>
                  ) : aiData.suggestions && aiData.suggestions.length > 0 ? (
                    <div>
                      <p style={aiDescriptionStyle}>
                        {aiData.explanation || 'Here are some suggestions for your code:'}
                      </p>
                      <ul style={suggestionListStyle}>
                        {aiData.suggestions.map((s, i) => (
                          <li key={i} style={suggestionItemStyle}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p style={aiDescriptionStyle}>
                      ⚠️ AI analysis is currently unavailable. Make sure the backend AI service is running.
                      <br/><br/>
                      To enable AI features: Start Ollama with <code>docker compose up -d</code>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Problem Understanding Section */}
          {aiData.problemUnderstanding && (
            <div style={problemUnderstandingSectionStyle}>
              <div style={collapsibleHeaderStyle} onClick={() => toggleSection('problemUnderstanding')}>
                <span style={iconStyle}>🧠</span>
                <span style={panelTitleStyle}>Problem Understanding</span>
                <span style={expandIconStyle}>{expandedSections.problemUnderstanding ? '▼' : '▶'}</span>
              </div>
              {expandedSections.problemUnderstanding && (
                <div style={aiContentStyle}>
                  <p style={aiDescriptionStyle}>{aiData.problemUnderstanding}</p>
                </div>
              )}
            </div>
          )}

          {/* Best Approach & Algorithm Section */}
          {aiData.algorithmName && (
            <div style={bestApproachSectionStyle}>
              <div style={collapsibleHeaderStyle} onClick={() => toggleSection('bestApproach')}>
                <span style={iconStyle}>🎯</span>
                <span style={panelTitleStyle}>Best Approach & Algorithm</span>
                <span style={expandIconStyle}>{expandedSections.bestApproach ? '▼' : '▶'}</span>
              </div>
              {expandedSections.bestApproach && (
                <div style={aiContentStyle}>
                  <div style={algorithmBadgeStyle}>{aiData.algorithmName}</div>
                  {aiData.bestApproach && <p style={aiDescriptionStyle}>{aiData.bestApproach}</p>}
                  {aiData.whyThisApproach && (
                    <div style={{ marginTop: 12 }}>
                      <div style={miniHeaderStyle}>Why This Approach:</div>
                      <p style={tipDescStyle}>{aiData.whyThisApproach}</p>
                    </div>
                  )}
                  {(aiData.timeComplexity || aiData.spaceComplexity) && (
                    <div style={complexityContainerStyle}>
                      {aiData.timeComplexity && (
                        <div style={complexityItemStyle}>
                          <span style={complexityLabelStyle}>⏱️ Time:</span>
                          <span style={complexityValueStyle}>{aiData.timeComplexity}</span>
                        </div>
                      )}
                      {aiData.spaceComplexity && (
                        <div style={complexityItemStyle}>
                          <span style={complexityLabelStyle}>💾 Space:</span>
                          <span style={complexityValueStyle}>{aiData.spaceComplexity}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Suggestions Section */}
          {aiData.suggestions && aiData.suggestions.length > 0 && (
            <div style={suggestionsSectionStyle}>
              <div style={collapsibleHeaderStyle} onClick={() => toggleSection('suggestions')}>
                <span style={iconStyle}>💡</span>
                <span style={panelTitleStyle}>Code Suggestions</span>
                <span style={expandIconStyle}>{expandedSections.suggestions ? '▼' : '▶'}</span>
              </div>
              {expandedSections.suggestions && (
                <div style={suggestionsContentStyle}>
                  <ul style={suggestionListStyle}>
                    {aiData.suggestions.map((s, i) => (
                      <li key={i} style={suggestionItemStyle}>{s}</li>
                    ))}
                  </ul>
                  {aiData.variables && aiData.variables.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={miniHeaderStyle}>Variable Improvements:</div>
                      {aiData.variables.map((v, i) => (
                        <div key={i} style={variableRenameStyle}>{v}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* YouTube Tutorials Section */}
          {youtubeLinks.length > 0 && (
            <div style={youtubeSectionStyle}>
              <div style={collapsibleHeaderStyle} onClick={() => toggleSection('youtube')}>
                <span style={iconStyle}>📺</span>
                <span style={panelTitleStyle}>YouTube Tutorials</span>
                <span style={expandIconStyle}>{expandedSections.youtube ? '▼' : '▶'}</span>
              </div>
              {expandedSections.youtube && (
                <div style={resourceContentStyle}>
                  {youtubeLinks.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer" style={resourceLinkItemStyle}>
                      <div style={resourceTitleStyle}>🎥 {link.title}</div>
                      {link.description && <div style={resourceDescStyle}>{link.description}</div>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Practice Problems Section */}
          {(gfgLinks.length > 0 || leetcodeLinks.length > 0 || striverLinks.length > 0 || hackerrankLinks.length > 0) && (
            <div style={practiceSectionStyle}>
              <div style={collapsibleHeaderStyle} onClick={() => toggleSection('practice')}>
                <span style={iconStyle}>💪</span>
                <span style={panelTitleStyle}>Practice Problems</span>
                <span style={expandIconStyle}>{expandedSections.practice ? '▼' : '▶'}</span>
              </div>
              {expandedSections.practice && (
                <div style={resourceContentStyle}>
                  {/* GeeksforGeeks */}
                  {gfgLinks.length > 0 && (
                    <div style={platformSectionStyle}>
                      <div style={platformHeaderStyle}>📗 GeeksforGeeks</div>
                      {gfgLinks.map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" style={platformLinkStyle}>
                          <div style={platformLinkTitleStyle}>• {link.title}</div>
                          <div style={platformLinkMetaStyle}>
                            {link.description && <span>{link.description}</span>}
                            {link.difficulty && <span style={difficultyBadgeStyle}>{link.difficulty}</span>}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* LeetCode */}
                  {leetcodeLinks.length > 0 && (
                    <div style={platformSectionStyle}>
                      <div style={platformHeaderStyle}>🟠 LeetCode</div>
                      {leetcodeLinks.map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" style={platformLinkStyle}>
                          <div style={platformLinkTitleStyle}>• {link.title}</div>
                          <div style={platformLinkMetaStyle}>
                            {link.description && <span>{link.description}</span>}
                            {link.difficulty && <span style={difficultyBadgeStyle}>{link.difficulty}</span>}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Striver's Sheet */}
                  {striverLinks.length > 0 && (
                    <div style={platformSectionStyle}>
                      <div style={platformHeaderStyle}>📘 Striver's A2Z DSA Sheet</div>
                      {striverLinks.map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" style={platformLinkStyle}>
                          <div style={platformLinkTitleStyle}>• {link.title}</div>
                          <div style={platformLinkMetaStyle}>
                            {link.description && <span>{link.description}</span>}
                            {link.difficulty && <span style={difficultyBadgeStyle}>{link.difficulty}</span>}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* HackerRank */}
                  {hackerrankLinks.length > 0 && (
                    <div style={platformSectionStyle}>
                      <div style={platformHeaderStyle}>🟢 HackerRank</div>
                      {hackerrankLinks.map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" style={platformLinkStyle}>
                          <div style={platformLinkTitleStyle}>• {link.title}</div>
                          <div style={platformLinkMetaStyle}>
                            {link.description && <span>{link.description}</span>}
                            {link.difficulty && <span style={difficultyBadgeStyle}>{link.difficulty}</span>}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Explanation Section (Only shows when there's an error) */}
          {error && errorExplanation.beginnerExplanation && (
            <div style={errorExplanationSectionStyle}>
              <div style={collapsibleHeaderStyle} onClick={() => toggleSection('error')}>
                <span style={iconStyle}>🐛</span>
                <span style={panelTitleStyle}>Error Explanation for Beginners</span>
                <span style={expandIconStyle}>{expandedSections.error ? '▼' : '▶'}</span>
              </div>
              {expandedSections.error && (
                <div style={errorContentStyle}>
                  <div style={errorSectionStyle}>
                    <div style={errorSubHeaderStyle}>❌ What Went Wrong:</div>
                    <p style={errorTextStyle}>{errorExplanation.beginnerExplanation}</p>
                  </div>
                  
                  {errorExplanation.whyItHappened && (
                    <div style={errorSectionStyle}>
                      <div style={errorSubHeaderStyle}>💡 Why This Happens:</div>
                      <p style={errorTextStyle}>{errorExplanation.whyItHappened}</p>
                    </div>
                  )}
                  
                  {errorExplanation.howToFix && errorExplanation.howToFix.length > 0 && (
                    <div style={errorSectionStyle}>
                      <div style={errorSubHeaderStyle}>🛠️ How to Fix It:</div>
                      <ol style={errorListStyle}>
                        {errorExplanation.howToFix.map((step, i) => (
                          <li key={i} style={errorListItemStyle}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  {errorExplanation.proTip && (
                    <div style={proTipStyle}>
                      <strong>🎓 Pro Tip:</strong> {errorExplanation.proTip}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// Styles
const rootStyle: React.CSSProperties = { 
  display: 'flex', 
  flexDirection: 'column', 
  height: '100vh',
  background: '#0d1117',
  color: '#c9d1d9'
}

const headerStyle: React.CSSProperties = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  padding: '16px 32px', 
  background: 'linear-gradient(135deg, #1a1f2e 0%, #161b22 100%)', 
  borderBottom: '2px solid #30363d',
  minHeight: 72,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
}

const headerLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16
}

const headerRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16
}

const logoContainerStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 12,
  background: 'linear-gradient(135deg, #1f6feb 0%, #0969da 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)'
}

const logoIconStyle: React.CSSProperties = {
  fontSize: 24
}

const headerTextContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2
}

const languageSelectorContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 16px',
  background: '#0d1117',
  borderRadius: 8,
  border: '1px solid #30363d'
}

const languageLabelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: '#e6edf3',
  letterSpacing: 0
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#8b949e',
  fontWeight: 400
}

const panelHeaderWithIconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '16px 20px',
  borderBottom: '1px solid #21262d',
  background: '#161b22',
  minHeight: 56
}

const iconStyle: React.CSSProperties = {
  fontSize: 18,
  flexShrink: 0,
  opacity: 0.9
}

const miniHeaderStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#8b949e',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: 0.5
}

const resourceLinkStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  color: '#58a6ff',
  marginTop: 8,
  textDecoration: 'none'
}

const outputContainerStyle: React.CSSProperties = {
  padding: 20,
  minHeight: 300,
  maxHeight: 500,
  overflow: 'auto'
}

const outputTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
  color: '#e6edf3',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  lineHeight: 1.7
}

const loadingStyle: React.CSSProperties = {
  color: '#58a6ff',
  fontSize: 15
}

// Error handling styles
const errorBadgeStyle: React.CSSProperties = { 
  background: '#dc2626', 
  color: 'white', 
  padding: '2px 8px', 
  borderRadius: 4, 
  fontSize: 12, 
  marginLeft: 8,
  fontWeight: 'bold'
}

const errorOutputStyle: React.CSSProperties = { 
  borderColor: '#dc2626',
  background: '#1f1f1f'
}

const connectionErrorStyle: React.CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  padding: 12,
  marginTop: 8,
  color: '#991b1b'
}

const errorTitleStyle: React.CSSProperties = {
  fontWeight: 'bold',
  marginBottom: 8,
  fontSize: 14
}

const errorMessageStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.4
}

const errorListStyle: React.CSSProperties = {
  margin: '8px 0',
  paddingLeft: 16
}

// New styles for enhanced UI sections
const collapsibleHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 18px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  background: 'transparent',
  cursor: 'pointer',
  transition: 'background 0.2s',
  fontSize: 15,
  fontWeight: 500,
  color: '#e6edf3'
}

const expandIconStyle: React.CSSProperties = {
  marginLeft: 'auto',
  fontSize: 12,
  color: '#8b949e',
  transition: 'transform 0.2s'
}

const problemUnderstandingSectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  margin: '0 0 1px 0',
  borderRadius: 0,
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  overflow: 'hidden'
}

const bestApproachSectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  margin: '0 0 1px 0',
  borderRadius: 0,
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  overflow: 'hidden'
}

const algorithmBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 14px',
  background: '#238636',
  color: 'white',
  borderRadius: 14,
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 12,
  textTransform: 'capitalize'
}

const complexityContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 12,
  padding: 0
}

const complexityItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  fontSize: 14
}

const complexityLabelStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#8b949e',
  fontWeight: 600
}

const complexityValueStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#c9d1d9',
  fontFamily: 'monospace'
}

const youtubeSectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  margin: '0 0 1px 0',
  borderRadius: 0,
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  overflow: 'hidden'
}

const practiceSectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  margin: '0 0 1px 0',
  borderRadius: 0,
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  overflow: 'hidden'
}

const resourceContentStyle: React.CSSProperties = {
  padding: 16
}

const resourceLinkItemStyle: React.CSSProperties = {
  display: 'block',
  padding: 12,
  marginBottom: 10,
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 8,
  textDecoration: 'none',
  border: '1px solid rgba(255,255,255,0.05)',
  transition: 'all 0.2s'
}

const resourceTitleStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#58a6ff',
  fontWeight: 500,
  marginBottom: 4
}

const resourceDescStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#8b949e',
  lineHeight: 1.5
}

const platformSectionStyle: React.CSSProperties = {
  marginBottom: 16
}

const platformHeaderStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: '#f0f6fc',
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: '1px solid rgba(255,255,255,0.1)'
}

const platformLinkStyle: React.CSSProperties = {
  display: 'block',
  padding: '10px 12px',
  marginBottom: 8,
  background: 'rgba(255,255,255,0.02)',
  borderRadius: 6,
  textDecoration: 'none',
  border: '1px solid rgba(255,255,255,0.05)',
  transition: 'all 0.2s'
}

const platformLinkTitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#58a6ff',
  marginBottom: 4
}

const platformLinkMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#8b949e',
  display: 'flex',
  gap: 10,
  alignItems: 'center'
}

const difficultyBadgeStyle: React.CSSProperties = {
  padding: '2px 8px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: 10,
  fontSize: 11,
  fontWeight: 500
}

const errorExplanationSectionStyle: React.CSSProperties = {
  background: 'rgba(220, 38, 38, 0.05)',
  margin: '0 0 1px 0',
  borderRadius: 0,
  border: 'none',
  borderLeft: '3px solid #dc2626',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  overflow: 'hidden'
}

const errorContentStyle: React.CSSProperties = {
  padding: 18
}

const errorSectionStyle: React.CSSProperties = {
  marginBottom: 16
}

const errorSubHeaderStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#f87171',
  marginBottom: 8
}

const errorTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#d1d5db',
  lineHeight: 1.6,
  margin: 0
}

const errorListItemStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#d1d5db',
  lineHeight: 1.6,
  marginBottom: 6
}

const proTipStyle: React.CSSProperties = {
  padding: 12,
  background: 'rgba(34, 197, 94, 0.1)',
  borderLeft: '3px solid #22c55e',
  borderRadius: 6,
  fontSize: 14,
  color: '#86efac',
  marginTop: 12
}

const errorListStyleOld: React.CSSProperties = {
  margin: '8px 0',
  paddingLeft: 16
}

// Missing styles
const titleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#f0f6fc',
  letterSpacing: 0.5
}

const selectStyle: React.CSSProperties = {
  padding: '6px 12px',
  background: '#161b22',
  color: '#e6edf3',
  border: '1px solid #30363d',
  borderRadius: 6,
  fontSize: 14,
  cursor: 'pointer',
  outline: 'none'
}

const runBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 24px',
  background: 'linear-gradient(135deg, #2ea043 0%, #238636 100%)',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 2px 8px rgba(46, 160, 67, 0.3)'
}

const runBtnDisabledStyle: React.CSSProperties = {
  opacity: 0.6,
  cursor: 'not-allowed'
}

const mainContainerStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
  position: 'relative'
}

const editorPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: '#0d1117',
  borderRight: '1px solid #21262d'
}

const panelTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
  color: '#e6edf3',
  letterSpacing: 0
}

const languageBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: '#1f6feb',
  color: 'white',
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 500,
  marginLeft: 'auto'
}

const macButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginLeft: 12
}

const macButtonStyle: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: '50%'
}

const dividerStyle = (isResizing: boolean): React.CSSProperties => ({
  width: 4,
  background: isResizing ? '#1f6feb' : '#21262d',
  cursor: 'col-resize',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s'
})

const dividerHandleStyle: React.CSSProperties = {
  width: 2,
  height: 40,
  background: '#30363d',
  borderRadius: 2
}

const rightPanelContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: '#0d1117',
  overflow: 'auto'
}

const aiSectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  margin: '0 0 1px 0',
  borderRadius: 0,
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  overflow: 'hidden'
}

const aiContentStyle: React.CSSProperties = {
  padding: 18,
  fontSize: 14,
  lineHeight: 1.7,
  color: '#c9d1d9'
}

const aiDescriptionStyle: React.CSSProperties = {
  color: '#c9d1d9',
  margin: 0,
  fontSize: 14,
  lineHeight: 1.7
}

const suggestionsSectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  margin: '0 0 1px 0',
  borderRadius: 0,
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  overflow: 'hidden'
}

const suggestionsContentStyle: React.CSSProperties = {
  padding: 16
}

const suggestionListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  color: '#7ee787'
}

const suggestionItemStyle: React.CSSProperties = {
  marginBottom: 10,
  fontSize: 14,
  lineHeight: 1.7
}

const variableRenameStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#ffa657',
  fontFamily: 'monospace',
  marginTop: 4
}

const tipDescStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#8b949e',
  lineHeight: 1.5
}

const outputSectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  margin: '0 0 1px 0',
  borderRadius: 0,
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  overflow: 'hidden',
  flex: 1,
  minHeight: 200
}

// Detect algorithmic patterns for hints
function detectAlgorithms(code: string): string[] {
  const hints: string[] = []
  if (/\bwhile\s*\(.*\)\s*\{[\s\S]*?\b(i\+\+|j\-\-)\b/.test(code) || /while\s+.*:\n[\s\S]*?(i\s*\+=\s*1|j\s*\-=\s*1)/.test(code)) {
    hints.push('Two pointers: move left/right indices towards target condition')
  }
  if (/\brecurs(e|ion)|def\s+.*\(.*\):\n\s*return\s+.*\(.*\)/i.test(code)) hints.push('Recursion detected: ensure base case and combine results')
  if (/\bhash(map|set)|dict\(|unordered_map\</i.test(code)) hints.push('Hashing: use O(1) average lookups for membership/aggregation')
  if (/\bsort\s*\(|std::sort|Arrays\.sort/.test(code)) hints.push('Sorting step present: consider time complexity O(n log n)')
  return hints
}


