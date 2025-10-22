### Backend (FastAPI)

Run locally

1. Create and activate venv
   - Windows PowerShell: `python -m venv .venv; . .venv\\Scripts\\Activate.ps1`
2. Install deps: `pip install -r requirements.txt`
3. Start dev server: `uvicorn app.main:app --reload`

Endpoints
- `GET /` health
- `GET /api/ping` ping
- `POST /execute` code execution
- `POST /ai/suggest` AI code suggestions (requires API key)
- `POST /auth/register` user registration
- `POST /auth/login` user login


