const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

type ApiError = {
  message: string
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  })
  if (!res.ok) {
    let message = 'Request failed'
    try {
      const data = (await res.json()) as ApiError | any
      message = data?.detail || data?.message || message
    } catch {}
    throw new Error(message)
  }
  return (await res.json()) as T
}

export async function registerUser(email: string, password: string) {
  return request<{ id: string; email: string }>(`/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function login(email: string, password: string) {
  return request<{ token: string }>(`/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}


