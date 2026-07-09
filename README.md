# 🧭 CareerCompass AI
### AI-Powered Career Counseling Companion
**Powered by IBM Watsonx.ai · Granite Models · Flask**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 Career Assessment | 3-step form capturing education, skills, interests & goals |
| 💡 AI Recommendations | Top career paths with match scores, salary & growth data |
| 📊 Skill Gap Analysis | Prioritized missing skills with learning timelines |
| 🗺️ Learning Roadmap | Phase-by-phase plan with resources & milestones |
| 📄 Resume Tips | ATS keywords, power words, bullet examples |
| 🤖 AI Chat | Real-time conversation with IBM Granite |
| 🌙 Dark Mode | Full dark/light theme with persistent preference |
| 📱 Responsive | Mobile-first Bootstrap 5 layout |

---

## 📁 Project Structure

```
career_counselor/
├── app.py                    # Flask backend + Watsonx.ai integration
├── .env.example              # Environment variable template
├── .env                      # Your credentials (NEVER commit this)
├── requirements.txt          # Python dependencies
├── README.md                 # This file
├── templates/
│   ├── base.html             # Navbar, footer, shared layout
│   ├── index.html            # Dashboard / landing page
│   ├── assessment.html       # Career assessment form (3 steps)
│   ├── chat.html             # AI chat interface
│   └── recommendations.html  # Results: paths, gaps, roadmap, resume
└── static/
    ├── css/
    │   └── style.css         # All styles (light + dark mode)
    └── js/
        ├── main.js           # Dark mode, counters, toast, fetch wrapper
        ├── assessment.js     # Multi-step form logic
        ├── chat.js           # Real-time chat
        └── recommendations.js # Dynamic rendering of AI results
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites

- Python 3.9+
- An [IBM Cloud account](https://cloud.ibm.com/registration)
- Watsonx.ai service enabled

### 2. Clone or copy the project

```bash
cd career_counselor
```

### 3. Create a virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure credentials

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```
IBM_API_KEY=your_ibm_cloud_api_key
WATSONX_PROJECT_ID=your_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-3-8b-instruct
FLASK_SECRET_KEY=your_random_secret_key
```

#### How to get IBM credentials:

| Field | Where to find it |
|---|---|
| `IBM_API_KEY` | IBM Cloud → Manage → Access (IAM) → API keys |
| `WATSONX_PROJECT_ID` | Watsonx.ai → Projects → Your Project → Manage tab |
| `WATSONX_URL` | Choose the region closest to you |

### 6. Run the app

```bash
python app.py
```

Open your browser → **http://localhost:5000**

---

## 🤖 Customizing the AI Agent

All agent behavior is controlled by the `AGENT_INSTRUCTIONS` dictionary at the top of `app.py`. You can edit it without touching any other code:

```python
AGENT_INSTRUCTIONS = {
    # Change the persona name and background
    "persona": "You are ...",

    # Options: "professional", "friendly", "motivational", "casual"
    "tone": "friendly and motivational",

    # Add or remove industry specializations
    "specializations": ["Technology", "Finance", ...],

    # "detailed" | "concise" | "structured"
    "recommendation_style": "structured",

    # Toggle emojis, timelines, resource links
    "formatting": {
        "use_emojis": True,
        "include_timelines": True,
        "max_recommendations": 5,
    },

    # Add custom ethics/safety rules
    "safety_guidelines": [...],
}
```

---

## 🔄 Changing the AI Model

In `.env`, change `WATSONX_MODEL_ID` to any available Granite model:

| Model ID | Best For |
|---|---|
| `ibm/granite-3-8b-instruct` | Fast, balanced (recommended) |
| `ibm/granite-13b-instruct-v2` | More detailed responses |
| `ibm/granite-3-2b-instruct` | Fastest, lightweight |

---

## 🌐 Deployment

### Option A — Gunicorn (Linux/macOS production)

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Option B — IBM Code Engine

1. Build a container:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "app:app"]
```

2. Push to IBM Container Registry and deploy via IBM Code Engine console.

### Option C — Heroku / Railway / Render

```bash
# Procfile
web: gunicorn app:app
```

Set environment variables in the platform's dashboard (never commit `.env`).

---

## 🔒 Security Notes

- **Never** commit `.env` to version control — it's listed in `.gitignore`
- Use `FLASK_DEBUG=False` in production
- Set a strong `FLASK_SECRET_KEY` (32+ random characters)
- For production, consider adding rate limiting (`flask-limiter`)

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| `AuthenticationError` | Check `IBM_API_KEY` in `.env` |
| `Project not found` | Verify `WATSONX_PROJECT_ID` |
| `Model not available` | Check model ID or region availability |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| Empty responses | Try `WATSONX_MODEL_ID=ibm/granite-13b-instruct-v2` |
| Flask won't start | Check `FLASK_PORT` isn't already in use |

---

## 📦 Dependencies

```
flask==3.0.3           # Web framework
python-dotenv==1.0.1   # .env file loading
ibm-watsonx-ai==1.1.2  # IBM Watsonx.ai SDK
requests==2.32.3       # HTTP client
gunicorn==22.0.0       # Production WSGI server
```

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

*Built with ❤️ using IBM Watsonx.ai & Granite Models*
