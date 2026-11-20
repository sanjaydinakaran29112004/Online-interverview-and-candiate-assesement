"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewController = void 0;
const uuid_1 = require("uuid");
const prisma_1 = require("../utils/prisma");
class InterviewController {
    static async scheduleInterview(req, res) {
        try {
            const { applicationId, title, interviewType = 'ONLINE_VIDEO', scheduledStartTime, scheduledEndTime, interviewerIds = [], meetingNotes } = req.body;
            if (!applicationId || !scheduledStartTime || !scheduledEndTime) {
                res.status(400).json({ success: false, message: 'applicationId, scheduledStartTime, and scheduledEndTime are required.' });
                return;
            }
            const application = await prisma_1.prisma.application.findUnique({
                where: { id: applicationId },
                include: { candidate: { include: { user: true } }, job: true }
            });
            if (!application) {
                res.status(404).json({ success: false, message: 'Application not found.' });
                return;
            }
            // Check if an active scheduled interview already exists for this candidate application
            const existingActive = await prisma_1.prisma.interview.findFirst({
                where: {
                    applicationId,
                    status: { in: ['SCHEDULED', 'CONFIRMED'] }
                },
                include: { participants: true }
            });
            if (existingActive) {
                // Update existing scheduled session with newly selected time and newly assigned interviewer
                await prisma_1.prisma.interview.update({
                    where: { id: existingActive.id },
                    data: {
                        title: title || existingActive.title,
                        interviewType,
                        scheduledStartTime: new Date(scheduledStartTime),
                        scheduledEndTime: new Date(scheduledEndTime),
                        meetingNotes
                    }
                });
                // Reassign the INTERVIEWER participant cleanly
                await prisma_1.prisma.interviewParticipant.deleteMany({
                    where: {
                        interviewId: existingActive.id,
                        participantRole: 'INTERVIEWER'
                    }
                });
                if (interviewerIds.length > 0) {
                    await prisma_1.prisma.interviewParticipant.createMany({
                        data: interviewerIds.map((uId) => ({
                            interviewId: existingActive.id,
                            userId: uId,
                            participantRole: 'INTERVIEWER'
                        }))
                    });
                }
                const updatedInterview = await prisma_1.prisma.interview.findUnique({
                    where: { id: existingActive.id },
                    include: {
                        participants: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
                        application: { include: { job: true, candidate: { include: { user: true } } } }
                    }
                });
                res.status(200).json({
                    success: true,
                    message: 'Existing interview schedule and assigned interviewer updated successfully.',
                    interview: updatedInterview
                });
                return;
            }
            // Generate a readable unique roomCode (e.g. room-abc123xyz)
            const roomCode = `room-${(0, uuid_1.v4)().substring(0, 8)}`;
            const interview = await prisma_1.prisma.interview.create({
                data: {
                    applicationId,
                    title: title || `${application.job.title} - Video Interview`,
                    interviewType,
                    scheduledStartTime: new Date(scheduledStartTime),
                    scheduledEndTime: new Date(scheduledEndTime),
                    roomCode,
                    meetingNotes,
                    status: 'SCHEDULED',
                    participants: {
                        create: [
                            // Candidate participant
                            {
                                userId: application.candidate.userId,
                                participantRole: 'CANDIDATE'
                            },
                            // Recruiter participant (scheduler)
                            {
                                userId: req.user.id,
                                participantRole: 'RECRUITER'
                            },
                            // Additional assigned interviewers
                            ...interviewerIds.map((uId) => ({
                                userId: uId,
                                participantRole: 'INTERVIEWER'
                            }))
                        ]
                    }
                },
                include: {
                    participants: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
                    application: { include: { job: true } }
                }
            });
            // Update application status
            await prisma_1.prisma.application.update({
                where: { id: applicationId },
                data: { status: 'INTERVIEW_SCHEDULED' }
            });
            // Notify candidate
            await prisma_1.prisma.notification.create({
                data: {
                    userId: application.candidate.userId,
                    title: 'Interview Scheduled',
                    message: `You have an interview scheduled for ${application.job.title} on ${new Date(scheduledStartTime).toLocaleString()}.`,
                    type: 'INTERVIEW',
                    link: `/candidate/interviews`
                }
            });
            res.status(201).json({
                success: true,
                message: 'Interview successfully scheduled.',
                interview
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async reassignInterviewer(req, res) {
        try {
            const { id } = req.params;
            const { interviewerId } = req.body;
            if (!interviewerId) {
                res.status(400).json({ success: false, message: 'interviewerId is required.' });
                return;
            }
            const newInterviewer = await prisma_1.prisma.user.findUnique({
                where: { id: interviewerId },
                include: { interviewerProfile: true }
            });
            if (!newInterviewer) {
                res.status(404).json({ success: false, message: 'Interviewer user record not found.' });
                return;
            }
            // Remove existing INTERVIEWER participant(s) for this session
            await prisma_1.prisma.interviewParticipant.deleteMany({
                where: { interviewId: id, participantRole: 'INTERVIEWER' }
            });
            // Insert new INTERVIEWER participant
            await prisma_1.prisma.interviewParticipant.create({
                data: {
                    interviewId: id,
                    userId: interviewerId,
                    participantRole: 'INTERVIEWER'
                }
            });
            const updated = await prisma_1.prisma.interview.findUnique({
                where: { id },
                include: {
                    participants: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
                    application: { include: { job: true, candidate: { include: { user: true } } } }
                }
            });
            res.json({
                success: true,
                message: `Interviewer successfully reassigned to ${newInterviewer.name}.`,
                interview: updated
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async listInterviews(req, res) {
        try {
            const { status } = req.query;
            const whereClause = {};
            if (status)
                whereClause.status = String(status);
            if (req.user.role === 'CANDIDATE') {
                const profile = await prisma_1.prisma.candidateProfile.findUnique({ where: { userId: req.user.id } });
                if (profile) {
                    whereClause.application = { candidateId: profile.id };
                }
            }
            else if (req.user.role === 'INTERVIEWER') {
                whereClause.participants = { some: { userId: req.user.id } };
            }
            const interviews = await prisma_1.prisma.interview.findMany({
                where: whereClause,
                include: {
                    application: {
                        include: {
                            job: true,
                            candidate: { include: { user: { select: { name: true, email: true } } } }
                        }
                    },
                    participants: { include: { user: { select: { id: true, name: true, role: true } } } },
                    assessmentReport: true
                },
                orderBy: { scheduledStartTime: 'desc' }
            });
            res.json({ success: true, interviews });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getInterviewByRoom(req, res) {
        try {
            const { roomCode } = req.params;
            const interview = await prisma_1.prisma.interview.findUnique({
                where: { roomCode },
                include: {
                    application: {
                        include: {
                            job: { include: { skills: true, questionSets: { include: { questions: true } } } },
                            candidate: { include: { user: { select: { id: true, name: true, email: true } } } }
                        }
                    },
                    participants: { include: { user: { select: { id: true, name: true, role: true } } } },
                    answers: { include: { evaluation: true, question: true } }
                }
            });
            if (!interview) {
                res.status(404).json({ success: false, message: 'Interview room not found.' });
                return;
            }
            res.json({ success: true, interview });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const data = { status };
            if (status === 'IN_PROGRESS')
                data.actualStartTime = new Date();
            if (status === 'COMPLETED')
                data.actualEndTime = new Date();
            const interview = await prisma_1.prisma.interview.update({
                where: { id },
                data
            });
            res.json({ success: true, message: `Interview status changed to ${status}.`, interview });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async recordConsent(req, res) {
        try {
            const { id } = req.params;
            const { consent } = req.body;
            await prisma_1.prisma.interviewParticipant.updateMany({
                where: {
                    interviewId: id,
                    userId: req.user.id
                },
                data: { consentGiven: Boolean(consent) }
            });
            res.json({ success: true, message: 'Recording consent recorded.' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async listAvailableInterviewers(req, res) {
        try {
            const interviewers = await prisma_1.prisma.user.findMany({
                where: { role: 'INTERVIEWER', status: 'ACTIVE' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    interviewerProfile: { select: { technicalDomain: true, yearsOfExperience: true } }
                },
                orderBy: { name: 'asc' }
            });
            res.json({ success: true, interviewers });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.InterviewController = InterviewController;
