const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

type ExecuteRequest = {
  language: 'python' | 'javascript' | 'cpp' | 'java'
  code: string
  stdin?: string
  trace?: boolean
}

type ExecuteResponse = {
  output?: string
  stderr?: string
}

export async function executeCode(body: ExecuteRequest): Promise<ExecuteResponse> {
  const res = await fetch(`${API_BASE}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    throw new Error((await res.text()) || 'Execution failed')
  }
  return (await res.json()) as ExecuteResponse
}


