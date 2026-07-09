"""
╔══════════════════════════════════════════════════════════════════════════════╗
║         AI-Powered Career Counseling Companion — IBM Watsonx.ai             ║
║         Powered by Granite Models via IBM Cloud                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import json
import re
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from dotenv import load_dotenv
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

# ─────────────────────────────────────────────────────────────────────────────
# LOAD ENVIRONMENT VARIABLES
# ─────────────────────────────────────────────────────────────────────────────
load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                        AGENT INSTRUCTIONS                               ║
# ║   Customize the agent behavior, tone, and specialization below.        ║
# ║   These instructions shape every AI response in the application.       ║
# ╚══════════════════════════════════════════════════════════════════════════╝
# ─────────────────────────────────────────────────────────────────────────────

AGENT_INSTRUCTIONS = {

    # ── 1. AGENT PERSONA ──────────────────────────────────────────────────
    "persona": (
        "You are CareerCompass AI, an expert career counselor and professional "
        "development coach with 20+ years of experience across technology, "
        "business, creative arts, healthcare, and engineering sectors. "
        "You combine deep industry knowledge with empathetic coaching skills."
    ),

    # ── 2. COMMUNICATION TONE ─────────────────────────────────────────────
    # Options: "professional", "friendly", "motivational", "academic", "casual"
    "tone": "friendly and motivational",

    # ── 3. CAREER SPECIALIZATION ──────────────────────────────────────────
    # Focus areas. Add or remove based on your target audience.
    "specializations": [
        "Technology & Software Engineering",
        "Data Science & AI/ML",
        "Cybersecurity & Cloud Computing",
        "Product Management & UX Design",
        "Finance & FinTech",
        "Healthcare & Biotech",
        "Creative Arts & Media",
        "Entrepreneurship & Startups",
        "Business Management & Consulting",
        "Engineering (Civil, Mechanical, Electrical)",
    ],

    # ── 4. RECOMMENDATION STYLE ───────────────────────────────────────────
    # "detailed"  → rich explanations, pros/cons, timelines
    # "concise"   → bullet points, quick wins
    # "structured"→ numbered steps, clear headers
    "recommendation_style": "structured",

    # ── 5. RESPONSE LANGUAGE ──────────────────────────────────────────────
    "language": "English",

    # ── 6. SAFETY & ETHICS GUIDELINES ────────────────────────────────────
    "safety_guidelines": [
        "Always be honest about market realities and job prospects.",
        "Never guarantee specific salaries or job placements.",
        "Encourage users to verify information from official sources.",
        "Be inclusive and avoid bias based on gender, ethnicity, or background.",
        "Respect mental health — be supportive if users express stress or anxiety.",
        "Do not provide legal or medical advice; redirect to professionals.",
        "Acknowledge AI limitations and suggest human counselors when needed.",
    ],

    # ── 7. RESPONSE FORMAT PREFERENCES ───────────────────────────────────
    "formatting": {
        "use_emojis": True,          # Set False for strictly professional output
        "use_bullet_points": True,
        "include_timelines": True,   # Show time estimates in roadmaps
        "include_resources": True,   # Recommend courses, platforms, books
        "max_recommendations": 5,    # Max career paths to suggest at once
    },

    # ── 8. DOMAIN-SPECIFIC KNOWLEDGE PROMPTS ─────────────────────────────
    "domain_context": (
        "You are aware of current job market trends (2024-2025), emerging "
        "technologies, in-demand certifications (AWS, GCP, Azure, PMP, CFA, etc.), "
        "top learning platforms (Coursera, Udemy, edX, LinkedIn Learning, "
        "Pluralsight), and realistic career progression timelines."
    ),

    # ── 9. FALLBACK BEHAVIOR ──────────────────────────────────────────────
    # What to do when uncertain or off-topic
    "fallback_message": (
        "I'm specialized in career counseling and professional development. "
        "For this topic, I'd recommend consulting a domain expert. "
        "Is there anything career-related I can help you with today? 🎯"
    ),
}

# ─────────────────────────────────────────────────────────────────────────────
# FLASK APP INITIALIZATION
# ─────────────────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-in-production")


# ─────────────────────────────────────────────────────────────────────────────
# WATSONX.AI CLIENT INITIALIZATION
# ─────────────────────────────────────────────────────────────────────────────
def get_watsonx_model() -> ModelInference:
    """Initialize and return a Watsonx.ai ModelInference instance."""
    credentials = Credentials(
        url=os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com"),
        api_key=os.getenv("IBM_API_KEY"),
    )
    return ModelInference(
        model_id=os.getenv("WATSONX_MODEL_ID", "ibm/granite-3-8b-instruct"),
        credentials=credentials,
        project_id=os.getenv("WATSONX_PROJECT_ID"),
        params={
            GenParams.MAX_NEW_TOKENS: 1024,
            GenParams.MIN_NEW_TOKENS: 50,
            GenParams.TEMPERATURE: 0.7,
            GenParams.TOP_P: 0.9,
            GenParams.TOP_K: 50,
            GenParams.REPETITION_PENALTY: 1.1,
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# PROMPT BUILDERS
# ─────────────────────────────────────────────────────────────────────────────
def _base_system_prompt() -> str:
    """Build the shared system preamble from AGENT_INSTRUCTIONS."""
    ai = AGENT_INSTRUCTIONS
    specs = ", ".join(ai["specializations"])
    safety = " ".join(ai["safety_guidelines"])
    fmt = ai["formatting"]
    emoji_note = "Use relevant emojis to make responses engaging." if fmt["use_emojis"] else "Avoid emojis."
    return (
        f"{ai['persona']}\n\n"
        f"Tone: {ai['tone']}.\n"
        f"Specializations: {specs}.\n"
        f"{ai['domain_context']}\n"
        f"Recommendation style: {ai['recommendation_style']}.\n"
        f"Safety: {safety}\n"
        f"{emoji_note}\n"
        f"Always respond in {ai['language']}.\n"
    )


def build_chat_prompt(user_message: str, history: list, profile: dict) -> str:
    profile_str = ""
    if profile:
        profile_str = (
            f"\nUser Profile:\n"
            f"  Education: {profile.get('education', 'Not specified')}\n"
            f"  Skills: {profile.get('skills', 'Not specified')}\n"
            f"  Interests: {profile.get('interests', 'Not specified')}\n"
            f"  Experience: {profile.get('experience', 'Not specified')} years\n"
            f"  Career Goal: {profile.get('career_goal', 'Not specified')}\n"
        )

    history_str = ""
    if history:
        for turn in history[-6:]:          # keep last 6 turns for context
            history_str += f"User: {turn['user']}\nAssistant: {turn['assistant']}\n\n"

    return (
        f"{_base_system_prompt()}"
        f"{profile_str}\n"
        f"Conversation History:\n{history_str}"
        f"User: {user_message}\n"
        f"Assistant:"
    )


def build_assessment_prompt(profile: dict) -> str:
    return (
        f"{_base_system_prompt()}\n"
        f"Perform a comprehensive career assessment for the following profile and "
        f"return a JSON object with these exact keys:\n"
        f"  career_paths (list of top {AGENT_INSTRUCTIONS['formatting']['max_recommendations']} career options with title, match_score 0-100, description, avg_salary, growth_outlook)\n"
        f"  skill_gaps (list of missing skills with skill_name, priority, learning_time)\n"
        f"  strengths (list of identified strengths)\n"
        f"  quick_wins (list of 3 immediate actions to take)\n\n"
        f"Profile:\n"
        f"  Name: {profile.get('name', 'User')}\n"
        f"  Education: {profile.get('education', '')}\n"
        f"  Field of Study: {profile.get('field_of_study', '')}\n"
        f"  Current Skills: {profile.get('skills', '')}\n"
        f"  Years of Experience: {profile.get('experience', 0)}\n"
        f"  Interests: {profile.get('interests', '')}\n"
        f"  Strengths: {profile.get('strengths', '')}\n"
        f"  Career Goal: {profile.get('career_goal', '')}\n"
        f"  Preferred Work Style: {profile.get('work_style', '')}\n\n"
        f"Respond ONLY with valid JSON. No markdown fences, no extra text.\n"
        f"Assistant:"
    )


def build_roadmap_prompt(career_path: str, profile: dict) -> str:
    return (
        f"{_base_system_prompt()}\n"
        f"Create a detailed step-by-step learning roadmap for '{career_path}'.\n"
        f"User background: {profile.get('education', 'General')} | "
        f"Skills: {profile.get('skills', 'Beginner')} | "
        f"Experience: {profile.get('experience', 0)} years.\n\n"
        f"Structure the roadmap as JSON with key 'phases' — a list of objects:\n"
        f"  phase_number, phase_name, duration, objectives (list), "
        f"  resources (list with name, platform, url_hint, type), "
        f"  milestone (string)\n\n"
        f"Include 4-6 phases from beginner to job-ready. "
        f"Respond ONLY with valid JSON. No markdown fences.\n"
        f"Assistant:"
    )


def build_resume_prompt(profile: dict, target_role: str) -> str:
    return (
        f"{_base_system_prompt()}\n"
        f"Provide actionable resume improvement tips for someone targeting "
        f"'{target_role}'.\n"
        f"Background: {profile.get('education', '')} | "
        f"Skills: {profile.get('skills', '')} | "
        f"Experience: {profile.get('experience', 0)} years.\n\n"
        f"Return JSON with:\n"
        f"  summary_tip (string),\n"
        f"  skills_section (list of strings),\n"
        f"  experience_bullets (list of strong action-verb bullet examples),\n"
        f"  keywords (list of ATS-friendly keywords for the role),\n"
        f"  common_mistakes (list of mistakes to avoid),\n"
        f"  power_words (list of impactful words to use)\n\n"
        f"Respond ONLY with valid JSON. No markdown fences.\n"
        f"Assistant:"
    )


# ─────────────────────────────────────────────────────────────────────────────
# HELPER: SAFE JSON EXTRACTION
# ─────────────────────────────────────────────────────────────────────────────
def extract_json(raw: str) -> dict | list:
    """Extract JSON from model output, stripping any surrounding prose."""
    raw = raw.strip()
    # Remove markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    # Find first { or [
    start = min(
        (raw.find("{") if raw.find("{") != -1 else len(raw)),
        (raw.find("[") if raw.find("[") != -1 else len(raw)),
    )
    raw = raw[start:]
    return json.loads(raw)


# ─────────────────────────────────────────────────────────────────────────────
# FLASK ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Dashboard / landing page."""
    return render_template("index.html", year=datetime.now().year)


@app.route("/assessment")
def assessment():
    """Career assessment form page."""
    return render_template("assessment.html", year=datetime.now().year)


@app.route("/chat")
def chat():
    """AI chat interface page."""
    return render_template("chat.html", year=datetime.now().year)


@app.route("/recommendations")
def recommendations():
    """Career recommendations results page."""
    return render_template("recommendations.html", year=datetime.now().year)


# ── API: SAVE PROFILE ────────────────────────────────────────────────────────
@app.route("/api/save-profile", methods=["POST"])
def save_profile():
    """Save user profile to session."""
    data = request.get_json()
    session["profile"] = data
    return jsonify({"status": "ok", "message": "Profile saved."})


# ── API: CHAT ────────────────────────────────────────────────────────────────
@app.route("/api/chat", methods=["POST"])
def api_chat():
    """Handle AI chat messages."""
    data = request.get_json()
    user_message = data.get("message", "").strip()
    if not user_message:
        return jsonify({"error": "Message cannot be empty."}), 400

    profile = session.get("profile", {})
    history = session.get("chat_history", [])

    prompt = build_chat_prompt(user_message, history, profile)

    try:
        model = get_watsonx_model()
        result = model.generate_text(prompt=prompt)
        reply = result.strip() if isinstance(result, str) else str(result)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        app.logger.error("Watsonx chat error: %s", exc)
        reply = str(exc)

    # Persist history (capped at 20 turns)
    history.append({"user": user_message, "assistant": reply})
    session["chat_history"] = history[-20:]

    return jsonify({"reply": reply, "timestamp": datetime.now().strftime("%H:%M")})


# ── API: ASSESS ──────────────────────────────────────────────────────────────
@app.route("/api/assess", methods=["POST"])
def api_assess():
    """Run full career assessment and return structured JSON."""
    profile = request.get_json()
    session["profile"] = profile          # persist for later use

    prompt = build_assessment_prompt(profile)

    try:
        model = get_watsonx_model()
        raw = model.generate_text(prompt=prompt)
        result = extract_json(raw)
    except json.JSONDecodeError:
        # Fallback: wrap raw text
        result = {
            "career_paths": [],
            "skill_gaps": [],
            "strengths": [],
            "quick_wins": [],
            "raw_response": raw,
            "parse_error": True,
        }
    except Exception as exc:
        app.logger.error("Watsonx assess error: %s", exc)
        return jsonify({"error": str(exc)}), 500

    session["assessment"] = result
    return jsonify(result)


# ── API: ROADMAP ─────────────────────────────────────────────────────────────
@app.route("/api/roadmap", methods=["POST"])
def api_roadmap():
    """Generate a learning roadmap for a chosen career path."""
    data = request.get_json()
    career_path = data.get("career_path", "Software Engineer")
    profile = session.get("profile", data.get("profile", {}))

    prompt = build_roadmap_prompt(career_path, profile)

    try:
        model = get_watsonx_model()
        raw = model.generate_text(prompt=prompt)
        result = extract_json(raw)
    except json.JSONDecodeError:
        result = {"phases": [], "raw_response": raw, "parse_error": True}
    except Exception as exc:
        app.logger.error("Watsonx roadmap error: %s", exc)
        return jsonify({"error": str(exc)}), 500

    return jsonify(result)


# ── API: RESUME TIPS ─────────────────────────────────────────────────────────
@app.route("/api/resume-tips", methods=["POST"])
def api_resume_tips():
    """Return resume improvement tips for a target role."""
    data = request.get_json()
    target_role = data.get("target_role", "Software Engineer")
    profile = session.get("profile", data.get("profile", {}))

    prompt = build_resume_prompt(profile, target_role)

    try:
        model = get_watsonx_model()
        raw = model.generate_text(prompt=prompt)
        result = extract_json(raw)
    except json.JSONDecodeError:
        result = {"raw_response": raw, "parse_error": True}
    except Exception as exc:
        app.logger.error("Watsonx resume error: %s", exc)
        return jsonify({"error": str(exc)}), 500

    return jsonify(result)


# ── API: CLEAR SESSION ───────────────────────────────────────────────────────
@app.route("/api/clear-session", methods=["POST"])
def clear_session():
    """Clear all session data."""
    session.clear()
    return jsonify({"status": "ok", "message": "Session cleared."})


# ── API: HEALTH CHECK ────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify({
        "status": "running",
        "model": os.getenv("WATSONX_MODEL_ID", "ibm/granite-3-8b-instruct"),
        "timestamp": datetime.now().isoformat(),
    })


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    print(f"\n[*] CareerCompass AI running on http://localhost:{port}")
    print(f"[*] Model: {os.getenv('WATSONX_MODEL_ID', 'ibm/granite-3-8b-instruct')}")
    print(f"[*] Debug mode: {debug}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
