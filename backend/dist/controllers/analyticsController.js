"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const prisma_1 = require("../utils/prisma");
class AnalyticsController {
    static async getRecruiterDashboardMetrics(req, res) {
        try {
            const [totalJobs, totalApplications, shortlistedCount, scheduledInterviews, completedInterviews, assessments, applicationsByStatus, recentActivities, allSkills] = await Promise.all([
                prisma_1.prisma.job.count(),
                prisma_1.prisma.application.count(),
                prisma_1.prisma.application.count({ where: { status: 'SHORTLISTED' } }),
                prisma_1.prisma.interview.count({ where: { status: 'SCHEDULED' } }),
                prisma_1.prisma.interview.count({ where: { status: 'COMPLETED' } }),
                prisma_1.prisma.candidateAssessment.findMany({ select: { overallScore: true, technicalScore: true, interviewScore: true } }),
                prisma_1.prisma.application.groupBy({ by: ['status'], _count: { id: true } }),
                prisma_1.prisma.auditLog.findMany({ take: 6, orderBy: { createdAt: 'desc' } }),
                prisma_1.prisma.jobSkill.groupBy({ by: ['skillName'], _count: { id: true }, take: 8, orderBy: { _count: { id: 'desc' } } })
            ]);
            const avgScore = assessments.length > 0
                ? Math.round(assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length)
                : 78;
            // Group applications by job
            const jobsWithAppCount = await prisma_1.prisma.job.findMany({
                select: { title: true, _count: { select: { applications: true } } },
                take: 6,
                orderBy: { applications: { _count: 'desc' } }
            });
            const applicationsByJob = jobsWithAppCount.map(j => ({
                name: j.title.length > 18 ? j.title.substring(0, 18) + '...' : j.title,
                applications: j._count.applications
            }));
            // Candidate status distribution
            const statusDistribution = applicationsByStatus.map(s => ({
                name: s.status.replace('_', ' '),
                value: s._count.id
            }));
            // Score distribution brackets (0-50, 51-70, 71-85, 86-100)
            const scoreBrackets = [
                { bracket: '0-50%', count: assessments.filter(a => a.overallScore <= 50).length },
                { bracket: '51-70%', count: assessments.filter(a => a.overallScore > 50 && a.overallScore <= 70).length },
                { bracket: '71-85%', count: assessments.filter(a => a.overallScore > 70 && a.overallScore <= 85).length },
                { bracket: '86-100%', count: assessments.filter(a => a.overallScore > 85).length }
            ];
            res.json({
                success: true,
                summary: {
                    totalJobs,
                    totalApplications,
                    shortlistedCount,
                    scheduledInterviews,
                    completedInterviews,
                    pendingEvaluations: Math.max(0, totalApplications - shortlistedCount - completedInterviews),
                    averageScore: avgScore
                },
                charts: {
                    applicationsByJob,
                    statusDistribution,
                    scoreDistribution: scoreBrackets,
                    skillDemand: allSkills.map(s => ({ skill: s.skillName, count: s._count.id }))
                },
                recentActivities
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getPerformanceAnalytics(req, res) {
        try {
            const [interviews, assessments, skills] = await Promise.all([
                prisma_1.prisma.interview.findMany({ select: { status: true, interviewType: true, scheduledStartTime: true } }),
                prisma_1.prisma.candidateAssessment.findMany({
                    select: { technicalScore: true, interviewScore: true, resumeScore: true, overallScore: true }
                }),
                prisma_1.prisma.skillAssessment.findMany({ select: { skillName: true, score: true } })
            ]);
            const completionRate = interviews.length > 0
                ? Math.round((interviews.filter(i => i.status === 'COMPLETED').length / interviews.length) * 100)
                : 85;
            const avgTechnical = assessments.length > 0
                ? Math.round(assessments.reduce((sum, a) => sum + a.technicalScore, 0) / assessments.length)
                : 76;
            const avgInterview = assessments.length > 0
                ? Math.round(assessments.reduce((sum, a) => sum + a.interviewScore, 0) / assessments.length)
                : 79;
            // Group skills for average competency radar
            const skillGroups = {};
            skills.forEach(s => {
                if (!skillGroups[s.skillName])
                    skillGroups[s.skillName] = { total: 0, count: 0 };
                skillGroups[s.skillName].total += s.score;
                skillGroups[s.skillName].count += 1;
            });
            const skillCompetency = Object.entries(skillGroups).slice(0, 6).map(([name, d]) => ({
                subject: name,
                averageScore: Math.round(d.total / d.count),
                fullMark: 100
            }));
            res.json({
                success: true,
                metrics: {
                    totalInterviews: interviews.length,
                    completionRate,
                    avgTechnicalScore: avgTechnical,
                    avgInterviewScore: avgInterview
                },
                skillCompetency
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
