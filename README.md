# AI-Based Online Interview and Candidate Assessment Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.9-F7931E.svg)](https://scikit-learn.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)

A production-style recruitment and candidate assessment web application connecting Recruiters, Technical Interviewers, Candidates, and Administrators. The system integrates automated resume parsing, real-time WebRTC video interviews, dynamic question generation, 5-dimensional explainable AI answer evaluation, and multi-criteria candidate rankings.

---

## 1. System Architecture & Working Principle

```
+-------------------------------------------------------------------------------+
|                             CLIENT TIER (React 18 + TS)                       |
|   +--------------------+  +----------------------+  +---------------------+   |
|   | Candidate Portal   |  | Recruiter Dashboard  |  | Admin & Governance  |   |
|   | - Applications     |  | - Job & Skill Matrix |  | - User Management   |   |
|   | - WebRTC Interview |  | - AI Question Sets   |  | - Audit Trail       |   |
|   | - AI Assessments   |  | - Ranking & Reports  |  | - System Settings   |   |
|   +--------------------+  +----------------------+  +---------------------+   |
+---------------------------------------+---------------------------------------+
                                        | HTTP/REST + WebSocket (Socket.IO)
                                        v
+-------------------------------------------------------------------------------+
|                            API GATEWAY / BACKEND (Node.js/Express + TS)       |
|  +--------------------+  +-----------------------+  +---------------------+   |
|  | JWT & RBAC Auth    |  | WebRTC Signaling Hub  |  | Assessment Engine   |   |
|  | Rate Limiter & Log |  | Socket.IO Room Server |  | PDF Report Builder  |   |
|  +--------------------+  +-----------------------+  +---------------------+   |
+-------------------+-------------------+-------------------+-------------------+
                    |                   |                   |
                    v                   v                   v
+-----------------------+   +-----------------------+   +-----------------------+
|  DATABASE (Prisma ORM)|   |  STORAGE REPOSITORY   |   | PYTHON AI MICROSERVICE|
|  - 23 Normalized      |   |  - Resumes (PDF/DOCX) |   |  (FastAPI + NLP)      |
|    Relational Models  |   |  - Assessment Reports |   | - TF-IDF / Cosine Sim |
|  - SQLite (Local Dev) |   |  - Consent Recordings |   | - Semantic Embeddings |
|  - PostgreSQL (Prod)  |   |                       |   | - Explainable Rubrics |
+-----------------------+   +-----------------------+   +-----------------------+
```

### Working Principle:
1. **Requisition Setup**: Recruiters create job openings and define required technical skills, experience brackets, and competency weights.
2. **AI Resume Analysis**: Candidates submit resumes (PDF/DOCX/text). The Python AI service parses text, extracts skills against a normalized taxonomy, and computes a transparent compatibility score without demographic bias.
3. **Adaptive Question Generation**: Role-specific questions are dynamically synthesized with expected concepts and evaluation rubrics across 6 interview categories.
4. **Live WebRTC Video Interview**: Candidates and interviewers join secure rooms with real-time video, audio, screen sharing, chat, and synchronized question prompts.
5. **Multi-Dimensional AI Evaluation**: Candidate answers are scored across 5 weighted dimensions:
   - **Technical Correctness (30%)**
   - **Semantic Relevance (25%)**
   - **Conceptual Depth (20%)**
   - **Completeness (15%)**
   - **Keyword Coverage (10%)**
6. **Human Oversight**: Interviewers can review and override AI scores with documented justification.
7. **Algorithmic Ranking & PDF Reports**: Synthesizes scores into comparative candidate rankings with radar charts and downloadable PDF assessment reports.

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Socket.IO Client, Axios.
- **Backend**: Node.js, Express, TypeScript, JWT Authentication, bcryptjs, Socket.IO, Multer, PDFKit.
- **Database**: PostgreSQL (Production) & SQLite (Zero-dependency local development) with Prisma ORM (23 normalized models).
- **AI Microservice**: Python 3.11+, FastAPI, Scikit-learn, TF-IDF vectorization, Cosine similarity, pypdf, python-docx.
- **Real-time Protocol**: WebRTC peer-to-peer audio/video streaming with Socket.IO signaling.

---

## 3. Demo Credentials

All demo accounts are pre-seeded with the password: **`Password123!`**

| Role | Email Address | Description |
|---|---|---|
| **Administrator** | `admin@platform.com` | Master system control, account status, security audit logs, AI rubric config |
| **Recruiter** | `recruiter1@techcorp.com` | Job management, resume review, question generation, candidate rankings |
| **Interviewer** | `interviewer1@techcorp.com` | Conduct video interviews, push questions, answer scoring, score overrides |
| **Candidate** | `candidate1@example.com` | Browse jobs, submit applications, upload resume, take assessments, download reports |

---

## 4. Quick Start: Running the Project Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Setup in 3 Commands:

```bash
# 1. Install dependencies & initialize database
cd backend && npm install && npm run db:setup && npm run build && cd ..

# 2. Install frontend dependencies & build
cd frontend && npm install && npm run build && cd ..

# 3. Install AI microservice dependencies
cd ai-service && pip install -r requirements.txt && cd ..
```

### Launching the Services (Open 3 Terminals):

#### Terminal 1: Python AI Microservice
```bash
cd ai-service
python -m uvicorn app.main:app --reload --port 8000
```
*Health Check: `http://localhost:8000/health`*

#### Terminal 2: Node.js Backend Server
```bash
cd backend
npm run dev
```
*Backend API: `http://localhost:5000/api/health`*

#### Terminal 3: React Frontend Application
```bash
cd frontend
npm run dev
```
*Access the Web Application: `http://localhost:5173`*

---

## 5. Automated End-to-End Test Suite

Run the full integration test verifying all backend routes, AI NLP scoring, authentication, and database queries:

```bash
node test-e2e.js
```

---

## 6. Module-Wise Feature Guide

- **Module 1: Authentication & User Governance**: JWT tokens, bcrypt hashing, RBAC (`ADMIN`, `RECRUITER`, `INTERVIEWER`, `CANDIDATE`).
- **Module 2: Recruiter Dashboard**: Live database KPI summaries, Recharts graphs for status distribution, applications by role, and score distributions.
- **Module 3: Job Management**: Create, edit, publish, and delete job openings with customizable skill weights.
- **Module 4: Candidate Profile & AI Resume Match**: PDF/DOCX parsing, skill extraction, and explainable compatibility percentage.
- **Module 5: AI Interview Question Generation**: Question bank generation by role, category, and difficulty level with rubrics.
- **Module 6: Automated Interview Scheduling**: Book time slots, prevent interviewer conflicts, generate unique room codes.
- **Module 7: Online Video Interview (WebRTC)**: Peer-to-peer video, audio toggle, screen sharing, in-room chat, and question synchronization.
- **Module 8: AI-Powered Answer Evaluation**: 5-metric scoring (Technical Correctness 30%, Semantic Relevance 25%, Conceptual Depth 20%, Completeness 15%, Keyword Coverage 10%).
- **Module 9: Skill-Based Candidate Scoring**: Multi-skill breakdown with radar competency mapping.
- **Module 10: Multi-Candidate Ranking**: Multi-criteria decision ranking with composite scores and side-by-side radar charts.
- **Module 11: Interview Performance Analytics**: Cohort benchmarks, completion rates, and score distributions.
- **Module 12: Automated Assessment Reports**: One-click downloadable branded PDF evaluation reports.
- **Module 13: IEEE Research Suite**: Empirical benchmark module calculating MAE, RMSE, Spearman rank correlation, and latency.
- **Module 14: Search, Filters & Audit Logs**: Advanced candidate filtering and immutable security event trail.

---

## 7. Docker Deployment

Launch the entire stack with Docker Compose:

```bash
docker-compose up --build -d
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- AI Microservice: `http://localhost:8000`

---

## 8. Switching to PostgreSQL for Cloud Production

The platform includes an automated database switch script:

```bash
cd backend
npm run db:use-postgres
```
Configure your connection string in `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```
And run:
```bash
npx prisma db push
npx ts-node-dev prisma/seed.ts
```

For complete cloud deployment instructions to Render, Vercel, and Supabase, refer to [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).
