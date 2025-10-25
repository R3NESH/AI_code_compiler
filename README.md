# Cloud Code Compiler

A modern, AI-powered online code compiler with real-time syntax help, intelligent suggestions, and multi-language support for Python, JavaScript, C++, and Java.

## 🚀 Features

- **Multi-Language Support**: Write and execute code in Python, JavaScript, C++, and Java
- **AI-Powered Assistance**: Get intelligent code suggestions and explanations using modern AI providers
- **Real-time Syntax Help**: Interactive tooltips and contextual guidance
- **Code Execution**: Run code instantly with input/output support
- **Interactive Challenges**: Practice with coding challenges and get AI-generated hints
- **Error Debugging**: Detailed error explanations and debugging assistance
- **Learning Resources**: Curated tutorials and documentation recommendations

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- CodeMirror 6 for code editing
- React Router for navigation
- Vite for fast development

### Backend
- FastAPI with Python
- Uvicorn ASGI server
- Pydantic for data validation
- Subprocess for code execution

### AI Integration
- **Ollama** (Dockerized local AI) - Default
- **OpenAI GPT-4o** / **Anthropic Claude** - Alternative external APIs
- Real-time code analysis
- Intelligent suggestions
- Error explanation

## 📋 Prerequisites

Before running the application, make sure you have the following installed:

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Docker** and **Docker Compose** (for AI features)
- **Java JDK 8+** (for Java code execution)
- **GCC/G++** (for C++ code execution)

## 🤖 AI Setup (Ollama)

### Step 1: Pull Ollama Docker Image

```bash
# Pull the official Ollama image
docker pull ollama/ollama:latest
```

### Step 2: Start Ollama Service

```bash
# Start Ollama with Docker Compose
docker compose up -d

# Check if Ollama is running
curl http://localhost:11434/api/tags
```

### Step 3: Download GGUF Models

Download GGUF models into the local `./models` folder:

```bash
# Create models directory (if not exists)
mkdir -p models

# Download Mistral 7B Instruct (recommended - ~4GB)
curl -L -o models/mistral-7b-instruct.Q4_0.gguf "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_0.gguf"

# Or download CodeLlama 7B (code-focused - ~4GB)
curl -L -o models/codellama-7b-instruct.Q4_0.gguf "https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_0.gguf"
```

### Step 4: Test the Integration

```bash
# Test Ollama API
curl http://localhost:11434/api/tags

# Test your backend chat endpoint
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello Ollama!"}'

# Test AI suggestions
curl -X POST http://localhost:8000/ai/suggest \
  -H "Content-Type: application/json" \
  -d '{"language": "python", "code": "print(\"hello\")", "cursor": 10}'
```

### Alternative: External AI APIs

If you prefer external APIs, update your `.env` file:

```env
AI_PROVIDER=openai  # or anthropic
OPENAI_API_KEY=your_key_here
```

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**For Windows:**
```cmd
# Clone the repository
git clone <your-repo-url>
cd cloud_finalyear

# Run the automated development setup
scripts\start-dev.bat
```

**For Linux/Mac:**
```bash
# Clone the repository
git clone <your-repo-url>
cd cloud_finalyear

# Run the automated development setup
./scripts/start-dev.sh
```

This script will:
- Check prerequisites
- Set up virtual environment
- Install dependencies
- Start both backend and frontend servers

### Option 2: Manual Setup

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env
# Edit .env with your configuration

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Copy environment file
cp env.example .env.local
# Edit .env.local with your configuration

# Start the frontend development server
npm run dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# AI Configuration (default: Ollama)
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b

# Alternative: External AI APIs
# OPENAI_API_KEY=your_openai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS Settings
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
# API Base URL
VITE_API_BASE=http://localhost:8000

# App Configuration
VITE_APP_NAME=Cloud Code Compiler
VITE_APP_VERSION=1.0.0
```

## 🧪 Testing

### Test Code Execution

1. Navigate to the Playground: http://localhost:5173/playground
2. Select a programming language
3. Write some code
4. Click "RUN" to execute

### Test AI Features

1. **With Ollama** (default):
   - Make sure Ollama is running: `docker compose up -d`
   - Ensure you have models in the `models/` directory
   - Test the API: `curl http://localhost:11434/api/tags`
   - Test the chat endpoint: `curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d '{"prompt": "Hello!"}'`

2. **With External APIs**:
   - Make sure you have a valid `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in your backend `.env` file
   - Set `AI_PROVIDER=openai` or `AI_PROVIDER=anthropic`

3. **Test in Frontend**:
   - Write code with potential improvements
   - Check the AI Suggestions panel for recommendations
   - Try the Challenges page for AI-generated hints

## 📁 Project Structure

```
cloud_finalyear/
├── backend/
│   ├── app/
│   │   └── main.py          # FastAPI application with Ollama integration
│   ├── requirements.txt     # Python dependencies
│   └── env.example         # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── routes/          # Page components
│   │   └── services/        # API services
│   ├── package.json         # Node.js dependencies
│   └── env.example         # Environment variables template
├── models/                  # GGUF model files (not versioned)
├── docker-compose.yml       # Ollama service
├── scripts/
│   ├── start-dev.sh        # Development startup script
│   ├── start-backend.sh    # Backend only startup
│   ├── start-frontend.sh   # Frontend only startup
│   └── build.sh            # Production build script
└── README.md
```

## 🚀 Deployment

### Deploy to Render (Recommended) ⭐

**Quick Deploy in 5 Minutes:**

1. **Push to GitHub/GitLab**
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Set `OPENAI_API_KEY` in backend service
   - Click "Apply"

3. **Done!** Your app will be live in ~5-10 minutes

**📖 Deployment Guides:**
- **Quick Start**: See [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md) - 5-minute guide
- **Complete Guide**: See [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) - Full documentation
- **Checklist**: See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Step-by-step

**✅ Verify Deployment Readiness:**
```bash
# Windows
.\scripts\verify-deployment-ready.ps1

# Linux/Mac
./scripts/verify-deployment-ready.sh
```

**💰 Cost:** Free tier available (750 hours/month)

---

### Local Production Build

```bash
# Windows
.\scripts\build-production.ps1

# Linux/Mac
./scripts/build-production.sh
```

### Manual Deployment (Other Platforms)

1. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   gunicorn app.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker
   ```

3. **Serve Frontend**: Use a web server (nginx, Apache) to serve `frontend/dist/`

## 🔧 Development

### Adding New Languages

1. **Backend**: Add language support in `backend/app/main.py`
2. **Frontend**: Update language types and extensions in frontend components
3. **CodeMirror**: Add language support in `frontend/src/components/CodeEditor.tsx`

### Adding New Features

1. **Backend**: Add new endpoints in `backend/app/main.py`
2. **Frontend**: Create new components in `frontend/src/components/`
3. **Services**: Add API calls in `frontend/src/services/`

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Kill process using port 8000
   lsof -ti:8000 | xargs kill -9
   ```

2. **Python Dependencies Issues**:
   ```bash
   # Recreate virtual environment
   rm -rf backend/venv
   python3 -m venv backend/venv
   source backend/venv/bin/activate
   pip install -r backend/requirements.txt
   ```

3. **Node.js Dependencies Issues**:
   ```bash
   # Clear npm cache and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Java/C++ Execution Issues**:
   - Ensure Java JDK is installed and `java`/`javac` are in PATH
   - Ensure GCC/G++ is installed and `g++` is in PATH

### Getting Help

- Check the API documentation at http://localhost:8000/docs
- Review the browser console for frontend errors
- Check the backend logs for server errors

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

---

**Happy Coding! 🎉**