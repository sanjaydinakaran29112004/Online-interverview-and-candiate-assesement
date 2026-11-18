import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { setupInterviewSocket } from './socket/interviewSocket';

// Import Routes
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';
import applicationRoutes from './routes/applicationRoutes';
import resumeRoutes from './routes/resumeRoutes';
import questionRoutes from './routes/questionRoutes';
import interviewRoutes from './routes/interviewRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import rankingRoutes from './routes/rankingRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import reportRoutes from './routes/reportRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(config.uploadDir));

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    aiServiceUrl: config.aiServiceUrl
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai/resume', resumeRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Setup Socket.IO WebRTC Signaling
setupInterviewSocket(io);

// Centralized Error Handler
app.use(errorHandler);

// Start Server
server.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(` AI Interview & Assessment Backend Server Running `);
  console.log(` URL: http://localhost:${config.port}`);
  console.log(` WebRTC Signaling Hub: Ready via Socket.IO`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(`=======================================================`);
});

export default app;
