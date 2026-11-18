# System Architecture & Development Plan
## AI-Based Online Interview and Candidate Assessment Platform

### 1. Executive Summary & Working Principle

The **AI-Based Online Interview and Candidate Assessment Platform** is a multi-tier SaaS recruitment intelligence system. It unifies Candidates, Recruiters, Interviewers, and Platform Administrators into an automated, transparent, evidence-based hiring pipeline.

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
|    Relational Models  |   |  - Assessment Reports |   | - TF-IDF / Embeddings |
|  - SQLite (Local Dev) |   |  - Consent Recordings |   | - Semantic Similarity |
|  - PostgreSQL (Prod)  |   |                       |   | - Explainable Rubrics |
+-----------------------+   +-----------------------+   +-----------------------+
```

#### Working Principle:
1. **Recruitment Setup & Job Skill Mapping**: Recruiters create job requisitions with required technical skills, experience brackets, educational criteria, and skill weights.
2. **Intelligent Resume Parsing & Fit Analysis**: When candidates submit their resumes, the Python AI service extracts technical skills, education, certifications, and experience text, performing semantic cosine similarity against the job requisition without bias.
3. **Adaptive Question Generation**: The platform generates question sets tailored by job role, skill category (Technical, HR, Behavioral, Situational), and difficulty level, including expected answer concepts and evaluation rubrics.
4. **Real-time WebRTC Online Interview**: Secure interview rooms provide peer-to-peer video, audio, screen sharing, live chat, interview timers, and real-time question display.
5. **AI Answer Evaluation**: Candidate responses are evaluated across 5 weighted dimensions:
   - Technical Correctness (30%)
   - Semantic Relevance (25%)
   - Conceptual Understanding (20%)
   - Completeness (15%)
   - Keyword Coverage (10%)
   The evaluation produces explainable feedback (strengths, missing concepts, improvements).
6. **Multi-dimensional Ranking & Analytics**: Candidate scores across resume match, technical tests, and live interview rubrics are synthesized into auditable candidate rankings.
7. **Automated PDF Reports**: Instant generation of comprehensive assessment reports with charts, breakdowns, and audit trails.

---

### 2. Development Execution Strategy

- **Phase 1: Project Foundation & Database Architecture** (Prisma ORM schema with 23 normalized models, SQLite/Postgres configurations, environment variables).
- **Phase 2: Authentication & RBAC** (JWT, bcryptjs, roles: ADMIN, RECRUITER, INTERVIEWER, CANDIDATE, protected routes).
- **Phase 3: Recruitment Management & File Upload** (Jobs, JobSkills, CandidateProfile, Applications, Multer secure storage).
- **Phase 4: Python AI Microservice** (FastAPI, Scikit-learn TF-IDF, Cosine Similarity, Resume Parser, Answer Evaluator, Rubric Engine, Question Generator).
- **Phase 5: Real-Time Interview & WebRTC Signaling** (Socket.IO room signaling, WebRTC peer connection, chat, timer, question prompt).
- **Phase 6: Candidate Assessment, Ranking & Analytics** (Skill-based scoring, multi-candidate comparison, Recharts visualizations, PDF report generation).
- **Phase 7: Administration, Audit Logs & Notifications** (System settings, user management, audit logging, in-app notifications).
- **Phase 8: End-to-End Verification, Seed Data & IEEE Experimentation Suite** (Test scripts, realistic seed dataset, model evaluation benchmarks).
