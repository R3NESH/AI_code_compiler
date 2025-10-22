export type RecommendItem = { 
  title: string
  url: string
  source?: string
  description?: string
  difficulty?: string
}

export type RecommendResponse = {
  items: RecommendItem[]
  youtubeVideos?: RecommendItem[]
  geeksforgeeks?: RecommendItem[]
  leetcode?: RecommendItem[]
  striverSheet?: RecommendItem[]
  hackerrank?: RecommendItem[]
}

export async function recommend(topic: string, language?: string): Promise<RecommendResponse> {
  const res = await fetch('/ai/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, language })
  })
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

// Hint functionality removed - keeping only AI suggestions, explain, and recommendations


