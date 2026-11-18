# Complete User Testing & Walkthrough Guide
## AI-Based Online Interview and Candidate Assessment Platform

### 1. Working Principle of the System

The platform operates on an evidence-driven, explainable recruitment workflow:

1. **Requisition & Skill Weighting**: Recruiters create job vacancies and specify required technical skills, minimum experience brackets, and competency weights.
2. **AI Resume Parsing & Fit Analysis**: When candidates submit resumes (PDF/DOCX/text), the Python AI microservice extracts technical skills, education, certifications, and experience text, computing semantic cosine similarity against the job requisition.
3. **Adaptive Question Generation**: The AI engine dynamically generates interview question sets calibrated by role, category (Technical, Programming, HR, Behavioral, Situational), and difficulty level, including expected concepts and scoring rubrics.
4. **Real-time WebRTC Video Interview**: A secure room with peer-to-peer audio/video streaming, screen sharing, recording consent, and an in-room synchronized question prompt.
5. **Multi-Dimensional AI Evaluation**: Candidate responses are evaluated across 5 strict dimensions:
   - **Technical Correctness (30%)**
   - **Semantic Relevance (25%)**
   - **Conceptual Understanding (20%)**
   - **Answer Completeness (15%)**
   - **Keyword Coverage (10%)**
   producing explainable feedback (strengths, missing concepts, growth areas).
6. **Human Override with Audit Trail**: Interviewers can review and override AI scores with documented justification.
7. **Algorithmic Ranking & PDF Reports**: Candidates are ranked through multi-criteria decision synthesis, and high-resolution PDF evaluation reports are automatically compiled.

---

### 2. Demo Credentials

All demonstration accounts are pre-seeded in the database with the default password: **`Password123!`**

| Role | Email Address | Access Level & Features |
|---|---|---|
| **Administrator** | `admin@platform.com` | User management, security audit logs, platform statistics, AI rubric configuration |
| **Recruiter** | `recruiter1@techcorp.com` | Create jobs, review resumes, generate question banks, schedule interviews, candidate rankings |
| **Interviewer** | `interviewer1@techcorp.com` | Join interview rooms, push questions, evaluate candidate answers, apply score overrides |
| **Candidate** | `candidate1@example.com` | Browse jobs, submit applications, upload resume for AI analysis, join video rooms, download reports |

---

### 3. Step-by-Step Instructions to Run the Application

Open 3 terminal windows in the project directory:

#### Terminal 1: Python AI Microservice
```bash
cd ai-service
python -m uvicorn app.main:app --reload --port 8000
```
*Health check URL: `http://localhost:8000/health`*

#### Terminal 2: Node.js Backend Server
```bash
cd backend
npm run dev
```
*Backend API URL: `http://localhost:5000/api/health`*

#### Terminal 3: React Frontend Application
```bash
cd frontend
npm run dev
```
*Open your browser at: `http://localhost:5173`*

---

### 4. How to Test Every Module

#### Test Flow A: Quick One-Click Login
1. Navigate to `http://localhost:5173/login`.
2. Click any of the **"Quick Fill Demo Credentials"** buttons (`Admin Demo`, `Recruiter Demo`, `Interviewer Demo`, or `Candidate Demo`).
3. Click **Sign In**. You will immediately be routed to the appropriate dashboard!

#### Test Flow B: Candidate Journey (Resume Upload & Job Application)
1. Log in as Candidate (`candidate1@example.com`).
2. Go to **"Resume & AI Match"** in the sidebar.
3. Select a target job opening from the dropdown (e.g. *Senior Full Stack Engineer*).
4. Click **Choose File** (select any PDF/DOCX) or paste resume text into the text area.
5. Click **Extract Skills & Calculate Compatibility**.
   - Notice the instant AI extraction of skills, education, experience, and the explainable compatibility percentage!
6. Go to **"Explore Openings"**, select a job, and click **Confirm & Submit Application**.
7. Check **"My Applications"** to see your live pipeline status.

#### Test Flow C: Recruiter Journey (AI Question Generation & Rankings)
1. Log in as Recruiter (`recruiter1@techcorp.com`).
2. Visit **"Recruiter Dashboard"** to view real-time database KPI cards and Recharts analytics (Applications by Role, Status Distribution, Assessment Score Distribution).
3. Go to **"AI Question Bank"**:
   - Choose a requisition (e.g., *Senior Full Stack Engineer*), select Category (*Technical Architecture*), and Difficulty (*Intermediate*).
   - Click **Generate Calibrated Questions**.
   - Observe the synthesized questions with expected concepts, rubrics, and time limits!
4. Go to **"Candidate Rankings"**:
   - View the algorithmic ranking list with composite scores.
   - Inspect the **Multi-Candidate Skill Radar Chart** comparing candidate dimensions!

#### Test Flow D: Live WebRTC Video Interview & Real-Time AI Scoring
1. In the Recruiter portal, go to **"Schedule & Rooms"**.
2. Notice the pre-created interview room (e.g., `room-demo101`). Click **Enter Room** (or open `http://localhost:5173/interview/room-demo101` in your browser).
3. In another browser tab (or incognito window), log in as Candidate and click **Join Video Room**.
4. Test the interactive controls:
   - Microphone mute / unmute toggle
   - Camera disable / enable toggle
   - Screen sharing button
   - Live in-room chat (send messages between tabs)
5. Test the **AI Answer Scoring**:
   - In the question panel, type a candidate answer (e.g., *"useMemo caches computed values to prevent recalculation. useCallback memoizes function references so child components wrapped with React.memo do not re-render unnecessarily."*).
   - Click **Submit & AI Evaluate**.
   - Within milliseconds, observe the **5-Metric Rubric Breakdown**:
     - Technical Correctness (30%)
     - Semantic Fit (25%)
     - Conceptual Depth (20%)
     - Completeness (15%)
     - Keyword Coverage (10%)
     along with Strengths and Improvement Areas!
6. Click **Human Interviewer Score Override** to adjust the score with documented notes.
7. Click **End Session** to finalize the assessment and compile the report.

#### Test Flow E: Official PDF Assessment Report Download
1. Navigate to **"Assessment Reports"** (`/candidate/assessments`).
2. Click **Download Official PDF Report**.
3. Open the downloaded PDF: notice the professional multi-page layout with score cards, skill competency bars, question-by-question breakdown, and evaluator recommendations!

#### Test Flow F: IEEE Research Suite
1. In the sidebar, click **"IEEE Research Suite"** (`/research/experiments`).
2. Click **Run IEEE Benchmark Suite**.
3. Watch the empirical model trial run in real-time, calculating:
   - Mean Absolute Error (MAE) comparing Baseline TF-IDF vs Hybrid NLP
   - Root Mean Squared Error (RMSE)
   - Spearman rank correlation ($\rho = 0.98+$)
   - Sub-second latency metrics with comparison bar charts!
