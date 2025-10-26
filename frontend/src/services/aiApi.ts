const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

type AISuggestRequest = {
  language: string
  code: string
  cursor?: number
  goal?: string
  hints?: string[]
}

export type AISuggestResponse = {
  suggestions: string[]
  explanation?: string
  qualityNotes?: string[]
  variables?: string[]
  problemUnderstanding?: string
  bestApproach?: string
  algorithmName?: string
  timeComplexity?: string
  spaceComplexity?: string
  whyThisApproach?: string
}

export async function aiSuggest(req: AISuggestRequest): Promise<AISuggestResponse> {
  const res = await fetch(`${API_BASE}/ai/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

export type AIExplainResponse = {
  summary: string
  lineFixes?: string[]
  walkthrough?: string[]
  beginnerExplanation?: string
  whyItHappened?: string
  howToFix?: string[]
  proTip?: string
}

export async function aiExplain(language: string, code: string, error?: string): Promise<AIExplainResponse> {
  const res = await fetch(`${API_BASE}/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, code, error })
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}


