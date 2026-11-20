"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
const interviewSocket_1 = require("./socket/interviewSocket");
// Import Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
const applicationRoutes_1 = __importDefault(require("./routes/applicationRoutes"));
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const questionRoutes_1 = __importDefault(require("./routes/questionRoutes"));
const interviewRoutes_1 = __importDefault(require("./routes/interviewRoutes"));
const assessmentRoutes_1 = __importDefault(require("./routes/assessmentRoutes"));
const rankingRoutes_1 = __importDefault(require("./routes/rankingRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize Socket.IO with CORS
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
});
app.set('io', io);
// Middlewares
app.use((0, cors_1.default)({ origin: '*', credentials: true }));
app.use(express_1.default.json({ limit: '20mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '20mb' }));
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(config_1.config.uploadDir));
// API Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config_1.config.nodeEnv,
        aiServiceUrl: config_1.config.aiServiceUrl
    });
});
// Mount Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/jobs', jobRoutes_1.default);
app.use('/api/applications', applicationRoutes_1.default);
app.use('/api/ai/resume', resumeRoutes_1.default);
app.use('/api/questions', questionRoutes_1.default);
app.use('/api/interviews', interviewRoutes_1.default);
app.use('/api/assessments', assessmentRoutes_1.default);
app.use('/api/rankings', rankingRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// Setup Socket.IO WebRTC Signaling
(0, interviewSocket_1.setupInterviewSocket)(io);
// Centralized Error Handler
app.use(errorHandler_1.errorHandler);
// Start Server on 0.0.0.0 for seamless Local & Cloud Hosting (Render/Railway/Docker)
server.listen(config_1.config.port, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` AI Interview & Assessment Backend Server Running `);
    console.log(` Port: ${config_1.config.port} (Host: 0.0.0.0)`);
    console.log(` WebRTC Signaling Hub: Ready via Socket.IO`);
    console.log(` Environment: ${config_1.config.nodeEnv}`);
    console.log(`=======================================================`);
});
exports.default = app;
