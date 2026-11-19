# Complete Cloud & Local Deployment Guide
## AI-Based Online Interview and Candidate Assessment Platform

This platform is architected for dual-environment execution:
1. **Local Development Mode**: Runs on your personal computer using SQLite and localhost ports.
2. **Production Cloud Mode**: Runs seamlessly on cloud platforms (Render, Railway, Vercel, Supabase, Neon PostgreSQL, or Docker) with zero code changes.

---

## 1. Architecture Overview

| Component | Technology | Default Local Port | Cloud Hosting Options |
| :--- | :--- | :--- | :--- |
| **Frontend Web Portal** | React 18, Vite, Tailwind CSS | `5173` | Vercel, Render Static, Netlify |
| **Backend & WebRTC Hub** | Node.js, Express, TypeScript, Socket.IO | `5000` | Render, Railway, AWS, Fly.io |
| **Database** | Prisma ORM (SQLite / PostgreSQL) | `file:./dev.db` | Supabase, Neon, Render Postgres |
| **AI Assessment Engine** | Python 3.10+, FastAPI, Scikit-learn, NLP | `8000` | Render Web Service, Railway |

---

## 2. Option A: 1-Click Deployment on Render (Recommended)

The repository includes a ready-to-use [`render.yaml`](./render.yaml) Blueprint configuration.

### Steps:
1. Log in to [Render](https://render.com).
2. Click **New +** &rarr; **Blueprint**.
3. Connect your Git repository.
4. Render will automatically read `render.yaml` and provision:
   - `ai-interview-db` (Managed Cloud PostgreSQL Database)
   - `ai-interview-ai-service` (Python FastAPI service)
   - `ai-interview-backend` (Node.js API & Socket.IO server)
   - `ai-interview-frontend` (React Single-Page Application with routing rewrites)
5. Click **Apply**. Your application will be live across custom cloud URLs with free automatic SSL (`https://...`).

---

## 3. Option B: Microservices on Vercel + Render / Railway

You can also host the Frontend on Vercel for fast global CDN distribution, and the Backend/DB on Render or Railway.

### Frontend on Vercel:
1. In [Vercel](https://vercel.com), click **Add New Project** and select the repository.
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-backend-url>/api`
   - `VITE_SOCKET_URL`: `https://<your-backend-url>`
4. Deploy! The included `frontend/vercel.json` ensures all React Router paths (`/candidate/dashboard`, `/login`, etc.) resolve properly without 404 errors.

### Backend on Render / Railway:
1. Create a Web Service pointing to the `backend` directory.
2. Set Build Command: `npm install && npm run db:use-postgres && npx prisma db push && npm run build`
3. Set Start Command: `npm run start`
4. Set Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your cloud PostgreSQL connection string (e.g. Supabase, Neon, or Railway)
   - `JWT_SECRET`: Random 64-character secret
   - `AI_SERVICE_URL`: URL of your deployed Python AI service (or use fallback mode)
   - `CLIENT_URL`: URL of your deployed Vercel frontend

### Python AI Service on Render / Railway:
1. Create a Web Service pointing to `ai-service`.
2. Set Build Command: `pip install -r requirements.txt`
3. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   - `ENVIRONMENT`: `production`
   - `USE_FALLBACK_NLP`: `true`

---

## 4. Option C: Docker Compose (Cloud VPS or Local Container)

You can run the entire platform with one command on any Linux/Windows VPS (AWS EC2, DigitalOcean, Hetzner):

```bash
docker-compose up --build -d
```

- Frontend: `http://<your-vps-ip>:5173`
- Backend API: `http://<your-vps-ip>:5000`
- AI Microservice: `http://<your-vps-ip>:8000/docs`

---

## 5. Switching Database Between Local and Cloud

Prisma is configured to switch between SQLite (Local Dev) and PostgreSQL (Cloud Production) instantly:

```bash
# Switch to PostgreSQL for Cloud Deployment:
cd backend
npm run db:use-postgres

# Switch back to SQLite for Local Offline Development:
cd backend
npm run db:use-sqlite
```

---

## 6. Environment Variables Reference

### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
JWT_SECRET="production-super-secret-jwt-key"
JWT_REFRESH_SECRET="production-super-secret-refresh-key"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="7d"
AI_SERVICE_URL="https://ai-interview-ai-service.onrender.com"
CLIENT_URL="https://ai-interview-frontend.vercel.app"
AI_FALLBACK_MODE=true
```

### Frontend (`frontend/.env`):
```env
VITE_API_URL=https://ai-interview-backend.onrender.com/api
VITE_SOCKET_URL=https://ai-interview-backend.onrender.com
```
