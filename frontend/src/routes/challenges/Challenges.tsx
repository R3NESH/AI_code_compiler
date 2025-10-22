import { useEffect, useMemo, useState } from 'react'
import { CodeEditor } from '../../components/CodeEditor'
// Hint functionality removed - keeping only AI suggestions, explain, and recommendations

type Language = 'python' | 'javascript' | 'cpp' | 'java'

const starter = {
  python: '# Two Sum\n# Return indices of the two numbers such that they add up to target.\n\nfrom typing import List\n\ndef two_sum(nums: List[int], target: int) -> List[int]:\n    # your code here\n    return []',
  javascript: '// Two Sum\nfunction twoSum(nums, target){\n  // your code here\n  return [];\n}',
  cpp: '// Two Sum\n#include <bits/stdc++.h>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target){\n  // your code here\n  return {};\n}',
  java: '// Two Sum\nimport java.util.*;\nclass Solution {\n  public int[] twoSum(int[] nums, int target){\n    // your code here\n    return new int[0];\n  }\n}'
}

export function Challenges(){
  const [language, setLanguage] = useState<Language>('python')
  const [code, setCode] = useState<string>(starter.python)

  useEffect(() => { setCode(starter[language]) }, [language])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
      <div style={{ background: '#0b1220', padding: 8 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select value={language} onChange={(e)=>setLanguage(e.target.value as Language)}>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>
        <div style={{ height: '65vh' }}>
          <CodeEditor value={code} language={language} onChange={setCode} />
        </div>
      </div>
      <div style={{ background: '#0b1220', color: '#e5e7eb', padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Guiding Questions</h3>
        <ul>
          <li>What are the inputs and outputs?</li>
          <li>What constraints affect the approach?</li>
          <li>Can you improve time/space complexity?</li>
        </ul>
        <h3>Templates</h3>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{templateFor(language)}</pre>
      </div>
    </div>
  )
}

function templateFor(lang: Language): string {
  switch (lang) {
    case 'python':
      return 'def solve():\n    # read input\n    # write solution\n\nif __name__ == "__main__":\n    solve()'
    case 'javascript':
      return 'function solve(){\n  // read input\n  // solution\n}\nsolve()'
    case 'cpp':
      return '#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  ios::sync_with_stdio(false); cin.tie(nullptr);\n  // solution\n  return 0;\n}'
    case 'java':
      return 'import java.io.*;\npublic class Main {\n  public static void main(String[] args) throws Exception {\n    // solution\n  }\n}'
  }
}


