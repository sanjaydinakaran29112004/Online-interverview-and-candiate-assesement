"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../utils/prisma");
class AdminController {
    static async listUsers(req, res) {
        try {
            const { role, status, search } = req.query;
            const whereClause = {};
            if (role)
                whereClause.role = String(role);
            if (status)
                whereClause.status = String(status);
            if (search) {
                whereClause.OR = [
                    { name: { contains: String(search) } },
                    { email: { contains: String(search) } }
                ];
            }
            const users = await prisma_1.prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    candidateProfile: { select: { headline: true, experienceYears: true } },
                    recruiterProfile: { select: { companyName: true } },
                    interviewerProfile: { select: { technicalDomain: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, users });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async updateUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
                res.status(400).json({ success: false, message: 'Invalid status value.' });
                return;
            }
            const user = await prisma_1.prisma.user.update({
                where: { id },
                data: { status }
            });
            // Audit Log
            await prisma_1.prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'ADMIN_USER_STATUS_CHANGE',
                    entity: 'User',
                    entityId: user.id,
                    details: `User status changed to ${status}`
                }
            });
            res.json({ success: true, message: `User status updated to ${status}.`, user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getPlatformStatistics(req, res) {
        try {
            const [totalUsers, usersByRole, totalJobs, totalApplications, totalInterviews, totalAssessments, auditLogsCount] = await Promise.all([
                prisma_1.prisma.user.count(),
                prisma_1.prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
                prisma_1.prisma.job.count(),
                prisma_1.prisma.application.count(),
                prisma_1.prisma.interview.count(),
                prisma_1.prisma.candidateAssessment.count(),
                prisma_1.prisma.auditLog.count()
            ]);
            const roleBreakdown = {};
            usersByRole.forEach(r => {
                roleBreakdown[r.role] = r._count.id;
            });
            res.json({
                success: true,
                stats: {
                    totalUsers,
                    roleBreakdown,
                    totalJobs,
                    totalApplications,
                    totalInterviews,
                    totalAssessments,
                    auditLogsCount,
                    systemStatus: 'HEALTHY'
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async listAuditLogs(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const [logs, total] = await Promise.all([
                prisma_1.prisma.auditLog.findMany({
                    include: { user: { select: { name: true, email: true, role: true } } },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.auditLog.count()
            ]);
            res.json({
                success: true,
                logs,
                pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async createUser(req, res) {
        try {
            const { email, password, name, role, companyName, technicalDomain, phone } = req.body;
            if (!email || !password || !name || !role) {
                res.status(400).json({ success: false, message: 'Email, password, name and role are required.' });
                return;
            }
            const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
            if (existing) {
                res.status(409).json({ success: false, message: 'User with this email already exists.' });
                return;
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            const userRole = role.toUpperCase();
            const user = await prisma_1.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: userRole,
                    status: 'ACTIVE'
                }
            });
            if (userRole === 'CANDIDATE') {
                await prisma_1.prisma.candidateProfile.create({
                    data: { userId: user.id, headline: 'Software Candidate', phone: phone || '' }
                });
            }
            else if (userRole === 'RECRUITER') {
                await prisma_1.prisma.recruiterProfile.create({
                    data: { userId: user.id, companyName: companyName || 'Enterprise Tech Corp', phone: phone || '' }
                });
            }
            else if (userRole === 'INTERVIEWER') {
                await prisma_1.prisma.interviewerProfile.create({
                    data: { userId: user.id, technicalDomain: technicalDomain || 'Full Stack & Distributed Systems' }
                });
            }
            await prisma_1.prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'ADMIN_CREATE_USER',
                    entity: 'User',
                    entityId: user.id,
                    details: `Admin created new ${userRole} account: ${email}`
                }
            });
            res.status(201).json({ success: true, message: `Account created successfully for ${email}.`, user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const userToDelete = await prisma_1.prisma.user.findUnique({ where: { id } });
            if (!userToDelete) {
                res.status(404).json({ success: false, message: 'User not found.' });
                return;
            }
            if (userToDelete.id === req.user.id) {
                res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
                return;
            }
            await prisma_1.prisma.user.delete({ where: { id } });
            await prisma_1.prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'ADMIN_DELETE_USER',
                    entity: 'User',
                    entityId: id,
                    details: `Admin deleted user account: ${userToDelete.email} (${userToDelete.role})`
                }
            });
            res.json({ success: true, message: 'User account deleted successfully.' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AdminController = AdminController;
