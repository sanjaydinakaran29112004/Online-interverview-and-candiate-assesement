# Cloud Deployment Guide
## AI-Based Online Interview and Candidate Assessment Platform

This guide outlines how to deploy the entire multi-tier system to production cloud providers.

---

### Architecture Overview

```
+-------------------------------------------------------------+
| Frontend (React + Vite)       -> Deployed on Vercel/Netlify |
| Backend API (Node + Express)  -> Deployed on Render/Railway |
| AI Microservice (FastAPI+NLP) -> Deployed on Render/Railway |
| Relational Database           -> PostgreSQL on Neon/Supabase|
+-------------------------------------------------------------+
```

---

### Step 1: PostgreSQL Database Setup (Neon / Supabase / Railway)

1. Create a free PostgreSQL instance on **[Neon](https://neon.tech)** or **[Supabase](https://supabase.com)**.
2. Copy your connection URI, for example:
   ```env
   DATABASE_URL="postgresql://username:password@ep-host.region.aws.neon.tech/interview_db?sslmode=require"
   ```
3. In `backend/prisma/schema.prisma`, switch the database provider to `postgresql`:
   - Run the automated switch script:
     ```bash
     cd backend
     npm run db:use-postgres
     ```
   - Or manually copy `backend/prisma/schema.postgresql.prisma` over `backend/prisma/schema.prisma`.
4. Apply the Prisma migrations:
   ```bash
   npx prisma db push
   npx ts-node-dev prisma/seed.ts
   ```

---

### Step 2: Python AI Microservice Deployment (Render)

1. In Render, select **New Web Service** and connect your repository.
2. Set **Root Directory**: `ai-service`
3. Set **Runtime**: `Python 3`
4. Set **Build Command**: `pip install -r requirements.txt`
5. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Set Environment Variables:
   - `ENVIRONMENT`: `production`
   - `USE_FALLBACK_NLP`: `true`
   - `OPENAI_API_KEY`: *(Optional - leave blank to use high-speed Scikit-learn TF-IDF engine)*
7. Note down the deployed URL (e.g., `https://ai-interview-ml.onrender.com`).

---

### Step 3: Node.js Backend Deployment (Render / Railway)

1. In Render, select **New Web Service** and point to `backend`.
2. Set **Root Directory**: `backend`
3. Set **Runtime**: `Node`
4. Set **Build Command**: `npm install && npx prisma generate && npm run build`
5. Set **Start Command**: `node dist/server.js`
6. Set Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `[Your PostgreSQL connection string]`
   - `JWT_SECRET`: `[Your secure 32+ char secret]`
   - `JWT_REFRESH_SECRET`: `[Your secure 32+ char refresh secret]`
   - `AI_SERVICE_URL`: `https://ai-interview-ml.onrender.com`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
7. Note down the deployed backend URL (e.g., `https://ai-interview-api.onrender.com`).

---

### Step 4: Frontend Deployment (Vercel)

1. Import your repository in **[Vercel](https://vercel.com)**.
2. Set **Root Directory**: `frontend`
3. Set **Framework Preset**: `Vite`
4. Set Environment Variables:
   - `VITE_API_URL`: `https://ai-interview-api.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://ai-interview-api.onrender.com`
5. Click **Deploy**. Vercel will build the frontend assets in under 30 seconds.

---

### Alternative: Single-Command Docker Deployment

You can run all three services locally or on any cloud VPS (AWS EC2, DigitalOcean) with Docker:

```bash
docker-compose up --build -d
```
All services will start up:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- AI Microservice: `http://localhost:8000`
