from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from uuid import uuid4
import subprocess
import tempfile
import textwrap
from typing import Optional
import os
import requests
from dotenv import load_dotenv
from threading import Lock
import json
from typing import Optional, Dict, Any

# Load environment variables from .env file
load_dotenv()

# Global counter for alternating API keys
_explain_counter = 0
_explain_lock = Lock()

app = FastAPI(title="Cloud Final Year API")

# Configure CORS from env; default allows common local dev ports
_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5177")
_allow_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "API is running"}


@app.get("/api/ping")
def ping():
    return {"pong": True}


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterResponse(BaseModel):
    id: str
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str


# Simple in-memory store for demo purposes
USERS: dict[str, dict] = {}


@app.post("/auth/register", response_model=RegisterResponse)
def register(req: RegisterRequest):
    if req.email in USERS:
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password too short")
    user_id = str(uuid4())
    USERS[req.email] = {"id": user_id, "email": req.email, "password": req.password}
    return {"id": user_id, "email": req.email}


@app.post("/auth/login", response_model=LoginResponse)
def login(req: LoginRequest):
    user = USERS.get(req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # Demo token only
    return {"token": f"demo-token-{user['id']}"}


class ExecuteRequest(BaseModel):
    language: str
    code: str
    stdin: Optional[str] = None
    trace: Optional[bool] = False


class ExecuteResponse(BaseModel):
    output: str | None = None
    stderr: str | None = None
    trace: Optional[list[dict]] = None  # [{line:int, locals:{k:v_repr}}]


@app.post("/execute", response_model=ExecuteResponse)
def execute(req: ExecuteRequest):
    lang = req.language.lower()
    if lang not in {"python", "javascript", "cpp", "java"}:
        raise HTTPException(status_code=400, detail="Unsupported language")

    try:
        if lang == "python":
            return run_python(req.code, req.stdin or "", trace=req.trace or False)
        if lang == "javascript":
            return run_node(req.code, req.stdin or "")
        if lang == "cpp":
            return run_cpp(req.code, req.stdin or "")
        if lang == "java":
            return run_java(req.code, req.stdin or "")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def run_python(code: str, stdin: str, trace: bool = False) -> ExecuteResponse:
    if not trace:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(textwrap.dedent(code))
            path = f.name
        return run_process(["python", path], stdin)

    # Tracing wrapper: collects locals per executed line
    wrapper = f"""
import sys, json
trace = []
def _trace(frame, event, arg):
    if event != 'line':
        return _trace
    try:
        locs = {{}}
        for k,v in frame.f_locals.items():
            # Filter out internal variables and built-ins
            if k.startswith('__') or k in ['self', 'cls', 'args', 'kwargs']:
                continue
            try:
                locs[k] = repr(v)[:200]
            except Exception:
                locs[k] = '<unrepr>'
        trace.append({{'line': frame.f_lineno, 'locals': locs}})
    except Exception:
        pass
    return _trace
code = compile({repr(code)}, '<user>', 'exec')
g = {{}}
sys.settrace(_trace)
try:
    exec(code, g, g)
except Exception as e:
    import traceback
    print('ERROR:' + traceback.format_exc(), file=sys.stderr)
finally:
    sys.settrace(None)
print('TRACE_JSON:' + json.dumps(trace))
"""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write(wrapper)
        wrapper_path = f.name
    proc = subprocess.run(["python", wrapper_path], input=stdin, capture_output=True, text=True, timeout=7)
    out = proc.stdout or ""
    trace_json = None
    if 'TRACE_JSON:' in out:
        prefix, _, rest = out.partition('TRACE_JSON:')
        out = prefix
        try:
            import json as _json
            trace_json = _json.loads(rest.strip())
        except Exception:
            trace_json = None
    return ExecuteResponse(output=out, stderr=proc.stderr or None if proc.returncode == 0 else (proc.stderr or 'Error'), trace=trace_json)


def run_node(code: str, stdin: str) -> ExecuteResponse:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False) as f:
        f.write(code)
        path = f.name
    return run_process(["node", path], stdin)


def run_cpp(code: str, stdin: str) -> ExecuteResponse:
    with tempfile.TemporaryDirectory() as tmp:
        src = f"{tmp}/main.cpp"
        out = f"{tmp}/a.exe"
        with open(src, "w") as f:
            f.write(code)
        compile_proc = subprocess.run(["g++", src, "-O2", "-static", "-s", "-o", out], capture_output=True, text=True)
        if compile_proc.returncode != 0:
            return ExecuteResponse(stderr=compile_proc.stderr)
        return run_process([out], stdin)


def run_java(code: str, stdin: str) -> ExecuteResponse:
    with tempfile.TemporaryDirectory() as tmp:
        # Extract class name from code
        class_match = None
        for line in code.split('\n'):
            if 'public class' in line:
                class_match = line.split('public class')[1].split()[0].strip('{').strip()
                break
        
        if not class_match:
            return ExecuteResponse(stderr="No public class found in Java code")
        
        src = f"{tmp}/{class_match}.java"
        with open(src, "w") as f:
            f.write(code)
        
        # Compile Java code
        compile_proc = subprocess.run(["javac", src], capture_output=True, text=True, cwd=tmp)
        if compile_proc.returncode != 0:
            return ExecuteResponse(stderr=compile_proc.stderr)
        
        # Run Java code
        return run_process(["java", class_match], stdin, cwd=tmp)


def run_process(cmd: list[str], stdin: str, cwd: str = None) -> ExecuteResponse:
    proc = subprocess.run(
        cmd,
        input=stdin,
        capture_output=True,
        text=True,
        timeout=5,
        cwd=cwd
    )
    return ExecuteResponse(output=proc.stdout, stderr=proc.stderr if proc.returncode != 0 else None)


# -------- AI: Ollama Integration --------

def query_ollama(model: str, prompt: str) -> str:
    """
    Query the local Ollama API for AI responses.
    
    Args:
        model: The model name to use (e.g., 'mistral:7b')
        prompt: The prompt to send to the model
        
    Returns:
        str: The response text from Ollama
        
    Raises:
        requests.exceptions.RequestException: If request fails
        ValueError: If response is invalid
    """
    try:
        ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "top_p": 0.9,
                "top_k": 40,
                "repeat_penalty": 1.1,
                "num_ctx": 4096
            }
        }
        
        response = requests.post(
            f"{ollama_url}/api/generate",
            json=payload,
            timeout=120
        )
        response.raise_for_status()
        
        data = response.json()
        return data.get('response', '')
            
    except requests.exceptions.Timeout:
        raise requests.exceptions.Timeout("Ollama request timed out after 120 seconds")
    except requests.exceptions.RequestException as e:
        raise requests.exceptions.RequestException(f"Ollama request failed: {str(e)}")
    except Exception as e:
        raise ValueError(f"Failed to parse Ollama response: {str(e)}")

def get_ollama_response(prompt: str) -> str:
    """
    Get response from the configured Ollama model.
    
    Args:
        prompt: The prompt to send to Ollama
        
    Returns:
        str: The response text from Ollama
        
    Raises:
        requests.exceptions.RequestException: If request fails
        ValueError: If no valid model is configured
    """
    model_name = os.getenv("OLLAMA_MODEL", "mistral:7b")
    
    try:
        return query_ollama(model_name, prompt)
    except Exception as e:
        raise ValueError(f"Ollama error: {str(e)}")


def get_ai_provider() -> str:
    """Get the configured AI provider."""
    return os.getenv("AI_PROVIDER", "ollama").lower()

def get_openai_response(prompt: str, api_key: str) -> str:
    """
    Make a request to OpenAI GPT-4o API.
    
    Args:
        prompt: The prompt to send to OpenAI
        api_key: The OpenAI API key
        
    Returns:
        str: The response text from OpenAI
        
    Raises:
        requests.exceptions.Timeout: If request times out
        requests.exceptions.RequestException: If request fails
    """
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful coding assistant. Always respond with valid JSON only, no markdown formatting."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": 1000
        }
        
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=15
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
        
    except requests.exceptions.Timeout:
        raise requests.exceptions.Timeout("OpenAI request timed out after 15 seconds")
    except requests.exceptions.RequestException as e:
        raise requests.exceptions.RequestException(f"OpenAI request failed: {str(e)}")

def get_anthropic_response(prompt: str, api_key: str) -> str:
    """
    Make a request to Anthropic Claude API.
    
    Args:
        prompt: The prompt to send to Claude
        api_key: The Anthropic API key
        
    Returns:
        str: The response text from Claude
        
    Raises:
        requests.exceptions.Timeout: If request times out
        requests.exceptions.RequestException: If request fails
    """
    try:
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": f"Always respond with valid JSON only, no markdown formatting. {prompt}"
                }
            ]
        }
        
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=payload,
            timeout=15
        )
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"]
        
    except requests.exceptions.Timeout:
        raise requests.exceptions.Timeout("Anthropic request timed out after 15 seconds")
    except requests.exceptions.RequestException as e:
        raise requests.exceptions.RequestException(f"Anthropic request failed: {str(e)}")


def get_llm_response(prompt: str) -> str:
    """
    Get response from the configured LLM provider.
    
    Args:
        prompt: The prompt to send to the LLM
        
    Returns:
        str: The response text from the LLM
        
    Raises:
        requests.exceptions.Timeout: If request times out
        requests.exceptions.RequestException: If request fails
        ValueError: If no valid API key is found
    """
    provider = get_ai_provider()
    
    if provider == "ollama":
        return get_ollama_response(prompt)
        
    elif provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found")
        return get_openai_response(prompt, api_key)
        
    elif provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found")
        return get_anthropic_response(prompt, api_key)
        
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")

def create_fallback_response(error_message: str = "AI service temporarily unavailable. Please try again.") -> dict:
    """
    Create a standardized fallback response for AI service failures.
    
    Args:
        error_message: The error message to include
        
    Returns:
        dict: The fallback response
    """
    return {"error": error_message}

# -------- AI: Gemini Proxy --------
class AISuggestRequest(BaseModel):
    language: str
    code: str
    cursor: int | None = None
    goal: str | None = None
    hints: list[str] | None = None


class AISuggestResponse(BaseModel):
    suggestions: list[str]
    explanation: str | None = None
    qualityNotes: list[str] | None = None
    variables: list[str] | None = None
    problemUnderstanding: str | None = None
    bestApproach: str | None = None
    algorithmName: str | None = None
    timeComplexity: str | None = None
    spaceComplexity: str | None = None
    whyThisApproach: str | None = None


class AIExplainRequest(BaseModel):
    language: str
    code: str
    error: str | None = None


class AIExplainResponse(BaseModel):
    summary: str
    lineFixes: list[str] | None = None
    walkthrough: list[str] | None = None
    beginnerExplanation: str | None = None
    whyItHappened: str | None = None
    howToFix: list[str] | None = None
    proTip: str | None = None


@app.post("/ai/suggest", response_model=AISuggestResponse)
def ai_suggest(req: AISuggestRequest):
    provider = get_ai_provider()
    
    print(f"[DEBUG] AI Provider: {provider}")
    print(f"[DEBUG] Request language: {req.language}")
    print(f"[DEBUG] Code length: {len(req.code)} characters")
    print(f"[DEBUG] Code content: '{req.code[:100]}{'...' if len(req.code) > 100 else ''}'")
    print(f"[DEBUG] Code is empty/short: {len(req.code.strip()) == 0 or len(req.code.strip()) < 10}")
    
    try:
        # Check if we have a valid configuration
        if provider == "ollama":
            # Ollama doesn't need API keys, just check if service is available
            ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
            try:
                # Quick health check
                health_response = requests.get(f"{ollama_url}/api/tags", timeout=5)
                if health_response.status_code != 200:
                    raise Exception("Ollama service not available")
            except Exception as e:
                print(f"[DEBUG] Ollama service not available: {e}, returning mock response")
                return AISuggestResponse(
                    suggestions=["Consider extracting function for readability.", "Use descriptive variable names."],
                    explanation="This suggestion improves code structure and maintainability.",
                    qualityNotes=["Avoid magic numbers", "Prefer early returns"],
                    variables=["leftIndex -> left", "rightIndex -> right"]
                )
        else:
            # Check if we have a valid API key for external providers
            api_key = None
            if provider == "openai":
                api_key = os.getenv("OPENAI_API_KEY")
            elif provider == "anthropic":
                api_key = os.getenv("ANTHROPIC_API_KEY")
            
            if not api_key:
                print(f"[DEBUG] No {provider.upper()} API key found, returning mock response")
                return AISuggestResponse(
                    suggestions=["Consider extracting function for readability.", "Use descriptive variable names."],
                    explanation="This suggestion improves code structure and maintainability.",
                    qualityNotes=["Avoid magic numbers", "Prefer early returns"],
                    variables=["leftIndex -> left", "rightIndex -> right"]
                )

        print(f"[DEBUG] Making {provider.upper()} API request with timeout 15s...")
        
        # Determine if code is empty or very short
        code_is_empty = len(req.code.strip()) == 0 or len(req.code.strip()) < 10
        
        if code_is_empty:
            # Special handling for empty/short code
            prompt = (
                f"Language: {req.language}\n"
                f"Goal: {req.goal or 'general'}\n"
                f"The user is starting to write code in {req.language}. "
                f"Provide helpful starter suggestions and best practices for {req.language} development. "
                f"Return ONLY valid JSON (no markdown formatting) with these exact keys:\n"
                "- suggestions: array of strings with practical starter suggestions\n"
                "- explanation: string explaining the suggestions\n"
                "- qualityNotes: array of strings with best practices\n"
                "- variables: array of strings with common variable naming tips\n"
                "- problemUnderstanding: string explaining what beginners typically start with\n"
                "- bestApproach: string with beginner-friendly coding tips\n"
                "- algorithmName: string (e.g., 'basic syntax' or 'hello world')\n\n"
                "Return only the JSON object, no other text:"
            )
        else:
            # Normal code analysis with enhanced fields
            prompt = (
                f"Language: {req.language}\n"
                f"Goal: {req.goal or 'general'}\n"
                f"Hints: {', '.join(req.hints or [])}\n"
                f"Cursor: {req.cursor}\n\n"
                "Analyze the following code for a BEGINNER programmer. Return ONLY valid JSON (no markdown formatting) with these exact keys:\n\n"
                "- problemUnderstanding: string (2-3 sentences explaining what problem the user is trying to solve in simple terms)\n"
                "- algorithmName: string (name of the algorithm/technique used, e.g., 'linear search', 'two pointer', 'recursion', 'sorting')\n"
                "- bestApproach: string (explain why this approach works for this problem)\n"
                "- timeComplexity: string (e.g., 'O(n) - You check each element once')\n"
                "- spaceComplexity: string (e.g., 'O(1) - Only uses a few variables')\n"
                "- whyThisApproach: string (explain why this is a good approach for beginners)\n"
                "- suggestions: array of strings with 3-5 specific code improvements\n"
                "- explanation: string explaining the main suggestion\n"
                "- qualityNotes: array of strings with code quality tips\n"
                "- variables: array of strings with variable rename suggestions (format: 'oldName -> newName')\n\n"
                f"Code:\n{req.code}\n\n"
                "Return only the JSON object, no other text:"
            )
        
        text = get_llm_response(prompt)
        print(f"[DEBUG] {provider.upper()} API response received successfully")
        print(f"[DEBUG] Response text length: {len(text)} characters")
        
        # Parse JSON response
        try:
            # Clean the response text - remove markdown code blocks if present
            cleaned_text = text.strip()
            if cleaned_text.startswith('```json'):
                cleaned_text = cleaned_text[7:]
                if cleaned_text.endswith('```'):
                    cleaned_text = cleaned_text[:-3]
                cleaned_text = cleaned_text.strip()
            elif cleaned_text.startswith('```'):
                cleaned_text = cleaned_text[3:]
                if cleaned_text.endswith('```'):
                    cleaned_text = cleaned_text[:-3]
                cleaned_text = cleaned_text.strip()
            
            print(f"[DEBUG] Cleaned response: {cleaned_text[:100]}...")
            
            parsed = json.loads(cleaned_text)
            print(f"[DEBUG] Successfully parsed JSON response")
            
            # Handle different response formats
            suggestions = []
            explanation = ""
            quality_notes = []
            variables = []
            
            if isinstance(parsed.get("suggestions"), list):
                for suggestion in parsed.get("suggestions", []):
                    if isinstance(suggestion, dict):
                        if "code" in suggestion:
                            suggestions.append(suggestion["code"])
                        elif "text" in suggestion:
                            suggestions.append(suggestion["text"])
                        else:
                            suggestions.append(str(suggestion))
                    else:
                        suggestions.append(str(suggestion))
            else:
                suggestions = [str(s) for s in parsed.get("suggestions", [])]
            
            explanation = str(parsed.get("explanation", ""))
            quality_notes = [str(note) for note in parsed.get("qualityNotes", [])]
            variables = [str(var) for var in parsed.get("variables", [])]
            
            # Extract new fields
            problem_understanding = str(parsed.get("problemUnderstanding", "")) if parsed.get("problemUnderstanding") else None
            best_approach = str(parsed.get("bestApproach", "")) if parsed.get("bestApproach") else None
            algorithm_name = str(parsed.get("algorithmName", "")) if parsed.get("algorithmName") else None
            time_complexity = str(parsed.get("timeComplexity", "")) if parsed.get("timeComplexity") else None
            space_complexity = str(parsed.get("spaceComplexity", "")) if parsed.get("spaceComplexity") else None
            why_this_approach = str(parsed.get("whyThisApproach", "")) if parsed.get("whyThisApproach") else None
            
            return AISuggestResponse(
                suggestions=suggestions,
                explanation=explanation,
                qualityNotes=quality_notes,
                variables=variables,
                problemUnderstanding=problem_understanding,
                bestApproach=best_approach,
                algorithmName=algorithm_name,
                timeComplexity=time_complexity,
                spaceComplexity=space_complexity,
                whyThisApproach=why_this_approach
            )
            
        except Exception as parse_error:
            print(f"[DEBUG] JSON parsing failed: {parse_error}")
            print(f"[DEBUG] Raw response: {text[:200]}...")
            return AISuggestResponse(
                suggestions=["Code suggestion temporarily unavailable. The AI response format was unexpected."],
                explanation="The AI service returned a response in an unexpected format. Please try again.",
                qualityNotes=[],
                variables=[]
            )
            
    except requests.exceptions.Timeout as timeout_error:
        print(f"[DEBUG] Request timeout: {timeout_error}")
        raise HTTPException(status_code=504, detail=create_fallback_response("AI service timeout - please try again"))
    except requests.exceptions.RequestException as req_error:
        print(f"[DEBUG] Request error: {req_error}")
        raise HTTPException(status_code=503, detail=create_fallback_response("Unable to connect to AI service"))
    except ValueError as value_error:
        print(f"[DEBUG] Configuration error: {value_error}")
        raise HTTPException(status_code=500, detail=create_fallback_response(f"AI configuration error: {str(value_error)}"))
    except Exception as e:
        print(f"[DEBUG] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=create_fallback_response(f"AI service error: {str(e)}"))


@app.post("/ai/explain", response_model=AIExplainResponse)
def ai_explain(req: AIExplainRequest):
    provider = get_ai_provider()
    
    try:
        # Enhanced prompt for beginner-friendly error explanations
        if req.error:
            prompt = (
                f"Language: {req.language}\n"
                f"Error Message: {req.error}\n\n"
                f"Code:\n{req.code}\n\n"
                "Explain this error to a COMPLETE BEGINNER who is just learning to code. "
                "Return ONLY valid JSON (no markdown formatting) with these exact keys:\n\n"
                "- beginnerExplanation: string (explain what went wrong in simple, non-technical language)\n"
                "- whyItHappened: string (explain why beginners commonly make this mistake)\n"
                "- howToFix: array of strings (step-by-step instructions to fix, numbered)\n"
                "- proTip: string (one sentence advice to avoid this error in the future)\n"
                "- summary: string (one-line summary of the error)\n"
                "- lineFixes: array of strings (specific line-by-line fixes)\n\n"
                "Return only the JSON object, no other text:"
            )
        else:
            # Code walkthrough without error
            prompt = (
                f"Language: {req.language}\n\n"
                f"Code:\n{req.code}\n\n"
                "Provide a beginner-friendly walkthrough of this code. "
                "Return ONLY valid JSON (no markdown formatting) with these exact keys:\n\n"
                "- summary: string (what this code does in simple terms)\n"
                "- walkthrough: array of strings (step-by-step explanation of what each part does)\n"
                "- beginnerExplanation: string (explain the overall logic for beginners)\n\n"
                "Return only the JSON object, no other text:"
            )
        
        text = get_llm_response(prompt)
        
        # Parse JSON response
        try:
            # Clean the response text
            cleaned_text = text.strip()
            if cleaned_text.startswith('```json'):
                cleaned_text = cleaned_text[7:]
                if cleaned_text.endswith('```'):
                    cleaned_text = cleaned_text[:-3]
                cleaned_text = cleaned_text.strip()
            elif cleaned_text.startswith('```'):
                cleaned_text = cleaned_text[3:]
                if cleaned_text.endswith('```'):
                    cleaned_text = cleaned_text[:-3]
                cleaned_text = cleaned_text.strip()
            
            parsed = json.loads(cleaned_text)
            
            return AIExplainResponse(
                summary=str(parsed.get("summary", "Code analysis completed")),
                lineFixes=[str(fix) for fix in parsed.get("lineFixes", [])] if parsed.get("lineFixes") else None,
                walkthrough=[str(step) for step in parsed.get("walkthrough", [])] if parsed.get("walkthrough") else None,
                beginnerExplanation=str(parsed.get("beginnerExplanation", "")) if parsed.get("beginnerExplanation") else None,
                whyItHappened=str(parsed.get("whyItHappened", "")) if parsed.get("whyItHappened") else None,
                howToFix=[str(step) for step in parsed.get("howToFix", [])] if parsed.get("howToFix") else None,
                proTip=str(parsed.get("proTip", "")) if parsed.get("proTip") else None
            )
            
        except Exception as parse_error:
            print(f"[DEBUG] Error explanation parsing failed: {parse_error}")
            # Fallback response
            return AIExplainResponse(
                summary="The error likely comes from a syntax or logic issue. Check the highlighted line.",
                lineFixes=["Review the syntax", "Check for missing symbols"],
                walkthrough=["Read the error message", "Identify the line number", "Fix the issue"],
                beginnerExplanation="Something in your code needs to be fixed. Look at the error message for clues.",
                whyItHappened="This is a common mistake when learning to code.",
                howToFix=["Read the error message carefully", "Check the line mentioned in the error", "Fix the syntax or logic issue"],
                proTip="Always read error messages carefully - they tell you exactly what's wrong!"
            )
            
    except Exception as e:
        print(f"[DEBUG] Error explanation failed: {e}")
        # Fallback response
        return AIExplainResponse(
            summary="Error analysis temporarily unavailable.",
            lineFixes=["Check syntax", "Review variable names"],
            walkthrough=["Debug step by step"],
            beginnerExplanation="An error occurred in your code. Try reviewing the syntax and logic.",
            proTip="Practice makes perfect - keep coding!"
        )


# ---------- Recommendations & Hints ----------

def generate_resource_links(algorithm_name: str, language: str) -> dict:
    """
    Generate dynamic learning resource links based on detected algorithm/topic.
    
    Args:
        algorithm_name: The detected algorithm or topic (e.g., "binary search", "two pointer")
        language: Programming language (e.g., "python", "javascript")
        
    Returns:
        dict: Dictionary containing categorized resource links
    """
    # Clean algorithm name for URLs
    algo_clean = algorithm_name.lower().replace(" ", "+")
    algo_dash = algorithm_name.lower().replace(" ", "-")
    algo_underscore = algorithm_name.lower().replace(" ", "_")
    
    return {
        "youtubeVideos": [
            {
                "title": f"{algorithm_name.title()} - Tutorial",
                "url": f"https://www.youtube.com/results?search_query={algo_clean}+tutorial+programming",
                "description": "General tutorial videos",
                "source": "youtube"
            },
            {
                "title": f"{algorithm_name.title()} - Visualization",
                "url": f"https://www.youtube.com/results?search_query={algo_clean}+visualization+animated",
                "description": "Visual explanations with animations",
                "source": "youtube"
            },
            {
                "title": f"{algorithm_name.title()} in {language.title()}",
                "url": f"https://www.youtube.com/results?search_query={algo_clean}+{language}+implementation+explained",
                "description": f"{language.title()}-specific implementation guide",
                "source": "youtube"
            }
        ],
        "geeksforgeeks": [
            {
                "title": f"{algorithm_name.title()} - Tutorial",
                "url": f"https://www.geeksforgeeks.org/{algo_dash}/",
                "description": "Theory, examples, and code",
                "difficulty": "Beginner-friendly",
                "source": "geeksforgeeks"
            },
            {
                "title": f"{algorithm_name.title()} - Practice Problems",
                "url": f"https://practice.geeksforgeeks.org/explore?page=1&sortBy=submissions",
                "description": "Practice problems on this topic",
                "difficulty": "Mixed",
                "source": "geeksforgeeks"
            }
        ],
        "leetcode": [
            {
                "title": f"{algorithm_name.title()} - Problem Set",
                "url": f"https://leetcode.com/problemset/all/?search={algo_clean}",
                "description": "Curated problems on this topic",
                "difficulty": "Easy to Hard",
                "source": "leetcode"
            },
            {
                "title": f"{algorithm_name.title()} - Discuss",
                "url": f"https://leetcode.com/discuss/study-guide?currentPage=1&orderBy=hot&query={algo_clean}",
                "description": "Community discussions and solutions",
                "difficulty": "All levels",
                "source": "leetcode"
            }
        ],
        "striverSheet": [
            {
                "title": "Striver's A2Z DSA Course Sheet",
                "url": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
                "description": "Comprehensive structured learning path",
                "difficulty": "Beginner to Advanced",
                "source": "striver"
            },
            {
                "title": f"Search: {algorithm_name.title()}",
                "url": f"https://takeuforward.org/?s={algo_clean}",
                "description": "Articles and videos on this topic",
                "difficulty": "All levels",
                "source": "striver"
            }
        ],
        "hackerrank": [
            {
                "title": f"{algorithm_name.title()} - Challenges",
                "url": "https://www.hackerrank.com/domains/algorithms",
                "description": "Practice challenges and contests",
                "difficulty": "Easy to Hard",
                "source": "hackerrank"
            },
            {
                "title": "Algorithm Practice",
                "url": "https://www.hackerrank.com/domains/tutorials/10-days-of-javascript",
                "description": "Structured learning tracks",
                "difficulty": "Beginner-friendly",
                "source": "hackerrank"
            }
        ]
    }


class RecommendRequest(BaseModel):
    topic: str
    language: str | None = None


class RecommendItem(BaseModel):
    title: str
    url: str
    source: str | None = None
    description: str | None = None
    difficulty: str | None = None


class RecommendResponse(BaseModel):
    items: list[RecommendItem]
    youtubeVideos: list[RecommendItem] | None = None
    geeksforgeeks: list[RecommendItem] | None = None
    leetcode: list[RecommendItem] | None = None
    striverSheet: list[RecommendItem] | None = None
    hackerrank: list[RecommendItem] | None = None


@app.post("/ai/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    """
    Generate curated learning resources based on topic/algorithm.
    Returns YouTube videos, GeeksforGeeks, LeetCode, Striver's Sheet, and HackerRank links.
    """
    try:
        language = req.language or "python"
        topic = req.topic or "programming basics"
        
        # Generate dynamic resource links
        resources = generate_resource_links(topic, language)
        
        # Legacy items for backward compatibility
        items = [
            {"title": f"{topic.title()} - Tutorial", "url": f"https://www.google.com/search?q={topic}+tutorial", "source": "search"},
            {"title": f"{topic.title()} - Documentation", "url": f"https://www.google.com/search?q={topic}+documentation", "source": "search"}
        ]
        
        return RecommendResponse(
            items=items,
            youtubeVideos=resources["youtubeVideos"],
            geeksforgeeks=resources["geeksforgeeks"],
            leetcode=resources["leetcode"],
            striverSheet=resources["striverSheet"],
            hackerrank=resources["hackerrank"]
        )
        
    except Exception as e:
        print(f"[DEBUG] Resource generation failed: {e}")
        # Fallback response
        return RecommendResponse(
            items=[{"title": "Search online", "url": f"https://www.google.com/search?q={req.topic}", "source": "search"}],
            youtubeVideos=[],
            geeksforgeeks=[],
            leetcode=[],
            striverSheet=[],
            hackerrank=[]
        )


# Hint endpoint removed - keeping only AI suggestions, explain, and recommendations


# Chat endpoint removed - keeping only AI suggestions, explain, and recommendations


