"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const rootDir = path_1.default.resolve(__dirname, '../../..');
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-ai-interview-platform-2025',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-jwt-refresh-key-ai-interview-2025',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    aiServiceUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    uploadDir: process.env.UPLOAD_DIR ? path_1.default.resolve(process.env.UPLOAD_DIR) : path_1.default.join(rootDir, 'uploads'),
    aiFallbackMode: process.env.AI_FALLBACK_MODE !== 'false'
};
