"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../utils/prisma");
const config_1 = require("../config");
class AuthController {
    static async register(req, res) {
        try {
            const { email, password, name, role, phone, companyName, technicalDomain, headline } = req.body;
            if (!email || !password || !name) {
                res.status(400).json({ success: false, message: 'Email, password, and name are required.' });
                return;
            }
            const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                res.status(409).json({ success: false, message: 'An account with this email already exists.' });
                return;
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            const userRole = (role || 'CANDIDATE').toUpperCase();
            const user = await prisma_1.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: userRole,
                    status: 'ACTIVE'
                }
            });
            // Create role-specific profile
            if (userRole === 'CANDIDATE') {
                await prisma_1.prisma.candidateProfile.create({
                    data: {
                        userId: user.id,
                        phone,
                        headline: headline ? headline.trim() : ''
                    }
                });
            }
            else if (userRole === 'RECRUITER') {
                await prisma_1.prisma.recruiterProfile.create({
                    data: {
                        userId: user.id,
                        companyName: companyName ? companyName.trim() : '',
                        phone
                    }
                });
            }
            else if (userRole === 'INTERVIEWER') {
                await prisma_1.prisma.interviewerProfile.create({
                    data: {
                        userId: user.id,
                        technicalDomain: technicalDomain ? technicalDomain.trim() : ''
                    }
                });
            }
            // Generate JWT tokens
            const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, config_1.config.jwtSecret, {
                expiresIn: config_1.config.jwtExpiresIn
            });
            const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, config_1.config.jwtRefreshSecret, {
                expiresIn: config_1.config.jwtRefreshExpiresIn
            });
            // Audit Log
            await prisma_1.prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'USER_REGISTERED',
                    entity: 'User',
                    entityId: user.id,
                    details: `User registered with role ${userRole}`
                }
            });
            res.status(201).json({
                success: true,
                message: 'Account successfully registered.',
                token,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ success: false, message: 'Email and password are required.' });
                return;
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { email },
                include: {
                    candidateProfile: true,
                    recruiterProfile: true,
                    interviewerProfile: true
                }
            });
            if (!user) {
                res.status(401).json({ success: false, message: 'Invalid email or password.' });
                return;
            }
            if (user.status !== 'ACTIVE') {
                res.status(403).json({ success: false, message: 'Account has been deactivated. Please contact administrator.' });
                return;
            }
            const isMatch = await bcryptjs_1.default.compare(password, user.password);
            if (!isMatch) {
                res.status(401).json({ success: false, message: 'Invalid email or password.' });
                return;
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, config_1.config.jwtSecret, {
                expiresIn: config_1.config.jwtExpiresIn
            });
            const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, config_1.config.jwtRefreshSecret, {
                expiresIn: config_1.config.jwtRefreshExpiresIn
            });
            await prisma_1.prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'USER_LOGIN',
                    entity: 'User',
                    entityId: user.id,
                    details: `User logged in from role ${user.role}`
                }
            });
            res.json({
                success: true,
                message: 'Authentication successful.',
                token,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    candidateProfile: user.candidateProfile,
                    recruiterProfile: user.recruiterProfile,
                    interviewerProfile: user.interviewerProfile
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Login error.' });
        }
    }
    static async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({ success: false, message: 'Refresh token required.' });
                return;
            }
            const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.config.jwtRefreshSecret);
            const user = await prisma_1.prisma.user.findUnique({ where: { id: decoded.id } });
            if (!user || user.status !== 'ACTIVE') {
                res.status(401).json({ success: false, message: 'Invalid refresh token.' });
                return;
            }
            const newToken = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, config_1.config.jwtSecret, {
                expiresIn: config_1.config.jwtExpiresIn
            });
            res.json({ success: true, token: newToken });
        }
        catch (error) {
            res.status(401).json({ success: false, message: 'Expired or invalid refresh token.' });
        }
    }
    static async me(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    status: true,
                    avatarUrl: true,
                    candidateProfile: true,
                    recruiterProfile: true,
                    interviewerProfile: true
                }
            });
            res.json({ success: true, user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async updateProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { name, phone, headline, summary, technicalSkills, portfolioUrl, linkedinUrl, githubUrl, companyName } = req.body;
            if (name) {
                await prisma_1.prisma.user.update({
                    where: { id: req.user.id },
                    data: { name }
                });
            }
            if (req.user.role === 'CANDIDATE') {
                await prisma_1.prisma.candidateProfile.upsert({
                    where: { userId: req.user.id },
                    update: { phone, headline, summary, technicalSkills, portfolioUrl, linkedinUrl, githubUrl },
                    create: { userId: req.user.id, phone, headline, summary, technicalSkills, portfolioUrl, linkedinUrl, githubUrl }
                });
            }
            else if (req.user.role === 'RECRUITER') {
                await prisma_1.prisma.recruiterProfile.upsert({
                    where: { userId: req.user.id },
                    update: { phone, companyName },
                    create: { userId: req.user.id, phone, companyName: companyName || 'Recruitment Org' }
                });
            }
            res.json({ success: true, message: 'Profile updated successfully.' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async forgotPassword(req, res) {
        const { email } = req.body;
        res.json({
            success: true,
            message: `Password reset instructions sent to ${email} (Demo code: 123456).`
        });
    }
    static async resetPassword(req, res) {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            res.status(400).json({ success: false, message: 'Email and new password are required.' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        res.json({ success: true, message: 'Password has been successfully updated.' });
    }
}
exports.AuthController = AuthController;
