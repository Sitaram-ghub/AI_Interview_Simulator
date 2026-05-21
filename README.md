# 🎙️ AI Interviewer - Asynchronous Mock Interview & Composure Analytics Platform

AI Interviewer is a modern, full-stack mock interview platform designed to help developers prepare for tough technical and behavioral rounds. Unlike static Q&A tools that only check if your answer is technically correct, this platform looks at the whole picture—evaluating your verbal answers, physical composure, eye contact, and emotional state in real time.

---

## 💡 Why I Built This

Preparing for tech interviews is stressful, and getting high-quality feedback is either extremely expensive or generic. Most mock interview apps only analyze the written transcript, completely ignoring the non-verbal cues—like nervous fidgeting, maintaining eye contact, or speaking with confidence—that make or break a real interview.

I wanted to build a high-fidelity, production-grade simulator that:
1. **Tracks composure natively in the browser** without sending heavy raw video feeds to expensive servers.
2. **Combines verbal and non-verbal metrics** into a single, cohesive dashboard report.
3. **Simulates actual progressive hiring pipelines** (like a "Day at FAANG" campaign) to make mock prep engaging rather than repetitive.

---

## 🧠 Key Technical Challenges I Solved

Building this platform came with a few tricky engineering hurdles that standard tutorials don't prepare you for:

### 1. The "Always Neutral" Resting Face Bias
When running `@vladmandic/face-api` client-side, the raw neural models returned `neutral` expressions with $95\% - 99\%$ confidence during normal resting states. This completely flattened the analytics chart, rendering the emotion tracker useless.
* **The Fix**: I implemented a custom behavior-aware scaling filter. I damped the neutral baseline ($\text{neutral} \times 0.18$) to let active cues shine, and introduced a non-linear smile booster ($\text{happy} \times 5.0$ when above a subtle $0.03$ threshold). I then synchronized this with the microphone state so that if a candidate smiles while speaking, the engagement metric gets an extra $1.3\times$ boost.

### 2. Preventing "Ghost Score" Bloating
Initially, if a candidate didn't say anything within the timer window, the browser's speech engine would time out. The frontend would submit a blank string, which the LLM evaluator would grade as having "Perfect 100% Grammar" and "100% Fluency" because there were no errors in an empty response.
* **The Fix**: I added empty-answer interceptors. If a response is blank, the system bypasses the LLM evaluator entirely, registers `"No answer submitted"`, and locks the scores to `0` or `"Not Evaluated"`.

### 3. Graceful Webcam Drops & Thread Synchronization
In the standard mock room and campaign gameplay, running webcam capture loops, face-detection models, and countdown timers simultaneously on the main browser thread often caused thread blocking and UI stutter. If the webcam disconnected mid-session, the timer kept ticking, penalizing the user.
* **The Fix**: I isolated the face-detection loops to asynchronous interval trackers and linked the timer's core hooks to the camera's active state. If the camera stream drops or is blocked, the countdown immediately freezes, displaying a glassmorphic permission overlay with zero blocking alert popups.

---

## 🚀 Key Features

* **🎭 Client-Side Smart-Cam Telemetry**: Evaluates physical composure (bounding-box shift tracking), eye contact alignment, and 5 distinct emotional states (Confident, Happy, Neutral, Nervous, Sad) directly in the browser using WebAssembly.
* **🎮 "Day at FAANG" Campaigns**: A structured 3-round progressive hiring simulation where players must maintain webcam compliance and hit strict target scores to unlock the next tier.
* **🎙️ Voice-to-Text & Automatic Grading**: Integrated continuous speech-recognition engine to capture verbal replies and score them on technical accuracy, grammar, fluency, and communication clarity.
* **📈 Rich Analytics Reports**: Responsive, custom-margined Recharts radar grids showing complete performance profiles without overlapping labels on smaller screens.
* **📄 Integrated ATS Parser**: A tool to upload PDF resumes, scan them against target job descriptions, extract keywords, and get structured improvement suggestions.

---

## 🛠️ The Tech Stack

* **Frontend**: React (Vite), Tailwind CSS/Vanilla CSS, Zustand (global state), Framer Motion (micro-animations), Recharts.
* **Backend**: FastAPI (Python), Motor (Async MongoDB client), Groq Cloud LLaMA-3 (low-latency natural language processing).
* **AI/ML Layer**: Client-side `@vladmandic/face-api` (local WASM models), browser Web Speech APIs.

---

## 📂 Project Layout

```text
AI-INTERVIEWER/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py              # JWT authentication & session gates
│   │   │   ├── interview.py         # Questions, evaluations, and hint endpoints
│   │   │   └── resume.py            # Resume upload & ATS keyword scanner
│   │   ├── services/
│   │   │   └── ai_service.py        # Groq LLaMA prompt templates and parser
│   │   ├── database.py              # Async Motor Mongo client lifecycle
│   │   └── main.py                  # CORS middleware and FastAPI lifespan
│   └── .env                         # API keys & DB URLs
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CampaignRoom.jsx     # Campaign mode round manager with camera overlays
│   │   │   ├── InterviewRoom.jsx    # Standalone mock room with timer freeze loops
│   │   │   ├── Reports.jsx          # Performance analytics report & radar charts
│   │   │   └── AtsChecker.jsx       # Resume upload page
│   │   ├── store/
│   │   │   └── interviewStore.js    # Global Zustand store for session persistence
```

---

## ⚙️ How to Setup & Run

### Step 1: Run the Backend
1. Go to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   * **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Setup your `.env` file inside the `backend/` root directory:
   ```env
   GROQ_API_KEY=your_groq_key_here
   MONGODB_URL="your_mongo_connection_url"
   JWT_SECRET=some_jwt_key
   ```
5. Spin up the server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

### Step 2: Run the Frontend
1. Go to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install Node modules:
   ```bash
   npm install
   ```
3. Run the client dev server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## 📡 API Reference & Core Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| **`/api/interview/generate`** | `POST` | Generates 5 randomized, role-specific questions matching the candidate's tier. |
| **`/api/interview/evaluate`** | `POST` | Runs natural language grading on answers and provides correct sample breakdowns. |
| **`/api/interview/hint`** | `POST` | Generates a 2-sentence hint for the active question (deducts 10 points). |
| **`/api/resume/analyze`** | `POST` | Parses PDF resumes and returns compatibility metrics and suggestions. |

---

## 🔮 Future Improvements I'm Planning

* **🔊 Vocal Inflection & Pitch Detection**: Add audio analyzer loops to track voice volume variation, pacing, and monotone speaking flags.
* **💻 In-Browser Whiteboarding**: Add system design canvas drawings and real-time coding challenges.
* **🌐 Local offline LLM execution**: Allow running evaluation steps using local models (like Llama Edge/Ollama) to reduce external API dependency entirely.

---

## ⚖️ License
Distributed under the MIT License. Feel free to use and adapt this for your own mock prep!
