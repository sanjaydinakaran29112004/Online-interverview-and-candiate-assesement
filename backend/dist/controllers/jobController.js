"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobController = void 0;
const prisma_1 = require("../utils/prisma");
class JobController {
    static async listJobs(req, res) {
        try {
            const { search, skill, location, employmentType, status, page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const whereClause = {};
            if (status) {
                whereClause.status = String(status);
            }
            else {
                // Default: only published jobs for public/candidates
                whereClause.status = 'PUBLISHED';
            }
            if (location) {
                whereClause.location = { contains: String(location) };
            }
            if (employmentType) {
                whereClause.employmentType = String(employmentType);
            }
            if (search) {
                whereClause.OR = [
                    { title: { contains: String(search) } },
                    { description: { contains: String(search) } },
                    { companyName: { contains: String(search) } }
                ];
            }
            if (skill) {
                whereClause.skills = {
                    some: {
                        skillName: { contains: String(skill) }
                    }
                };
            }
            const [jobs, total] = await Promise.all([
                prisma_1.prisma.job.findMany({
                    where: whereClause,
                    include: {
                        skills: true,
                        _count: { select: { applications: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                prisma_1.prisma.job.count({ where: whereClause })
            ]);
            res.json({
                success: true,
                jobs,
                pagination: {
                    total,
                    page: Number(page),
                    totalPages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getJobById(req, res) {
        try {
            const { id } = req.params;
            const job = await prisma_1.prisma.job.findUnique({
                where: { id },
                include: {
                    skills: true,
                    recruiter: {
                        include: { user: { select: { name: true, email: true } } }
                    },
                    _count: { select: { applications: true } }
                }
            });
            if (!job) {
                res.status(404).json({ success: false, message: 'Job posting not found.' });
                return;
            }
            res.json({ success: true, job });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async createJob(req, res) {
        try {
            const { title, companyName, description, department, location, employmentType, minExperience, maxExperience, educationalReq, salaryRange, openingsCount, deadline, skills } = req.body;
            if (!title || !description || !location) {
                res.status(400).json({ success: false, message: 'Title, description, and location are required.' });
                return;
            }
            let recruiterId = req.user?.recruiterProfileId;
            if (!recruiterId) {
                // Find or create recruiter profile
                let profile = await prisma_1.prisma.recruiterProfile.findUnique({ where: { userId: req.user.id } });
                if (!profile) {
                    profile = await prisma_1.prisma.recruiterProfile.create({
                        data: {
                            userId: req.user.id,
                            companyName: companyName || 'Company Inc'
                        }
                    });
                }
                recruiterId = profile.id;
            }
            const job = await prisma_1.prisma.job.create({
                data: {
                    title,
                    companyName: companyName || 'Global Tech',
                    description,
                    department,
                    location,
                    employmentType: employmentType || 'FULL_TIME',
                    minExperience: minExperience ? parseFloat(minExperience) : 0,
                    maxExperience: maxExperience ? parseFloat(maxExperience) : 10,
                    educationalReq,
                    salaryRange,
                    openingsCount: openingsCount ? parseInt(openingsCount, 10) : 1,
                    deadline: deadline ? new Date(deadline) : null,
                    recruiterId,
                    status: 'PUBLISHED',
                    skills: {
                        create: Array.isArray(skills)
                            ? skills.map((s) => ({
                                skillName: typeof s === 'string' ? s : s.skillName,
                                weight: typeof s === 'object' && s.weight ? parseFloat(s.weight) : 1.0,
                                isRequired: typeof s === 'object' && s.isRequired !== undefined ? Boolean(s.isRequired) : true,
                                minimumProficiency: typeof s === 'object' && s.minimumProficiency ? s.minimumProficiency : 'INTERMEDIATE'
                            }))
                            : []
                    }
                },
                include: { skills: true }
            });
            // Audit Log
            await prisma_1.prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'JOB_CREATED',
                    entity: 'Job',
                    entityId: job.id,
                    details: `Job created: ${job.title}`
                }
            });
            res.status(201).json({ success: true, message: 'Job successfully published.', job });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async updateJob(req, res) {
        try {
            const { id } = req.params;
            const { skills, ...data } = req.body;
            if (data.minExperience)
                data.minExperience = parseFloat(data.minExperience);
            if (data.maxExperience)
                data.maxExperience = parseFloat(data.maxExperience);
            if (data.openingsCount)
                data.openingsCount = parseInt(data.openingsCount, 10);
            if (data.deadline)
                data.deadline = new Date(data.deadline);
            const job = await prisma_1.prisma.job.update({
                where: { id },
                data
            });
            if (Array.isArray(skills)) {
                await prisma_1.prisma.jobSkill.deleteMany({ where: { jobId: id } });
                await prisma_1.prisma.jobSkill.createMany({
                    data: skills.map((s) => ({
                        jobId: id,
                        skillName: typeof s === 'string' ? s : s.skillName,
                        weight: typeof s === 'object' && s.weight ? parseFloat(s.weight) : 1.0,
                        isRequired: typeof s === 'object' && s.isRequired !== undefined ? Boolean(s.isRequired) : true,
                        minimumProficiency: typeof s === 'object' && s.minimumProficiency ? s.minimumProficiency : 'INTERMEDIATE'
                    }))
                });
            }
            res.json({ success: true, message: 'Job updated successfully.', job });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async deleteJob(req, res) {
        try {
            const { id } = req.params;
            await prisma_1.prisma.job.delete({ where: { id } });
            res.json({ success: true, message: 'Job requisition deleted.' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.JobController = JobController;
