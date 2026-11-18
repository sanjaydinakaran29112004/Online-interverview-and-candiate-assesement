# REST & WebSocket API Specification
## AI-Based Online Interview and Candidate Assessment Platform

### Base URL: `http://localhost:5000/api`
### AI Service URL: `http://localhost:8000/api/ai`

---

### 1. Authentication & User Management (`/auth`)
- `POST /auth/register` - Create new user account (Candidate, Recruiter, Interviewer).
- `POST /auth/login` - Authenticate with email/password; returns JWT + User details.
- `POST /auth/refresh` - Issue new access token using refresh token.
- `POST /auth/logout` - Invalidate session tokens.
- `GET /auth/me` - Fetch profile of currently authenticated user.
- `PUT /auth/profile` - Update user profile information.
- `POST /auth/forgot-password` - Request password reset code.
- `POST /auth/reset-password` - Complete password reset.

### 2. Job Requisition Management (`/jobs`)
- `GET /jobs` - List published jobs with query filters (search, skill, location, employment type, pagination).
- `POST /jobs` - Create a new job requisition with skill weights (Recruiter/Admin).
- `GET /jobs/:id` - Fetch full job details including required skills and application count.
- `PUT /jobs/:id` - Update job details or status (`DRAFT`, `PUBLISHED`, `CLOSED`).
- `DELETE /jobs/:id` - Soft delete job requisition.

### 3. Application Lifecycle (`/applications`)
- `POST /applications` - Apply for a job vacancy (Candidate).
- `GET /applications` - List applications (Filtered by candidate if Candidate, or by job if Recruiter/Admin).
- `GET /applications/:id` - Get single application with resume and status timeline.
- `PATCH /applications/:id/status` - Update application status (`APPLIED`, `SHORTLISTED`, `REJECTED`, `INTERVIEW_SCHEDULED`, etc.).

### 4. AI Resume & Skill Analysis (`/ai/resume`)
- `POST /ai/resume/analyze` - Upload and analyze resume PDF/DOCX for skills, experience, and match score against a job.
- `GET /ai/resume/:id` - Get previously cached/persisted resume analysis.

### 5. AI Question Bank & Generation (`/questions`)
- `POST /questions/generate` - Trigger AI generation of role-specific questions with rubrics.
- `GET /questions` - List available question sets and custom questions.
- `POST /questions` - Create custom question with rubric and expected concepts.
- `GET /questions/:id` - Retrieve question details and criteria.

### 6. Interview Scheduling & Video Room (`/interviews`)
- `POST /interviews` - Schedule an interview with candidate and interviewers.
- `GET /interviews` - List upcoming and historical interviews.
- `GET /interviews/:id` - Fetch interview session details and room token.
- `PUT /interviews/:id` - Reschedule interview.
- `DELETE /interviews/:id` - Cancel interview.
- `POST /interviews/:id/confirm` - Candidate confirms interview time slot.
- `POST /interviews/:id/consent` - Record participant recording consent.

### 7. AI Answer Evaluation & Candidate Scoring (`/assessments`)
- `POST /assessments/evaluate-answer` - Submit candidate answer text; calls AI service to compute 5-metric score + explainable feedback.
- `POST /assessments/override-score` - Interviewer manual override with justification notes.
- `GET /assessments/:id` - Fetch full assessment record with skill breakdown.
- `POST /assessments/finalize` - Compile total candidate assessment score and generate report.

### 8. Ranking & Candidate Comparison (`/rankings`)
- `GET /rankings/:jobId` - Fetch ranked list of candidates for a job opening based on multi-dimensional scores.
- `GET /rankings/compare?candidateIds=1,2,3` - Multi-candidate side-by-side radar and bar comparison.

### 9. Analytics & Reporting (`/analytics`, `/reports`)
- `GET /analytics/recruiter` - Recruiter dashboard statistics and distribution metrics.
- `GET /analytics/admin` - Platform-wide system KPIs and usage metrics.
- `GET /reports/:id` - Fetch JSON data for candidate assessment report.
- `GET /reports/:id/pdf` - Download high-resolution branded PDF assessment report.

### 10. Notifications & Audit Logs (`/notifications`, `/admin`)
- `GET /notifications` - Get user notifications.
- `PATCH /notifications/:id/read` - Mark notification as read.
- `GET /admin/users` - Admin user management.
- `PATCH /admin/users/:id/status` - Activate / deactivate user.
- `GET /admin/audit-logs` - View system security and activity logs.

---

### WebSocket (Socket.IO) Events:
- `join-room`: Candidate / Interviewer joins interview room.
- `user-connected` / `user-disconnected`: Peer presence notifications.
- `offer` / `answer` / `ice-candidate`: WebRTC signaling exchange.
- `chat-message`: Live chat during interview.
- `next-question`: Interviewer pushes current question to candidate's screen.
- `recording-consent-changed`: Syncs recording state between participants.
