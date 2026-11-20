import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export class AnalyticsController {
  static async getRecruiterDashboardMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [
        totalJobs,
        totalApplications,
        shortlistedCount,
        scheduledInterviews,
        completedInterviews,
        assessments,
        applicationsByStatus,
        recentActivities,
        allSkills,
        evaluatedApplications
      ] = await Promise.all([
        prisma.job.count(),
        prisma.application.count(),
        prisma.application.count({ where: { status: 'SHORTLISTED' } }),
        prisma.interview.count({ where: { status: 'SCHEDULED' } }),
        prisma.interview.count({ where: { status: 'COMPLETED' } }),
        prisma.candidateAssessment.findMany({ select: { overallScore: true, technicalScore: true, interviewScore: true } }),
        prisma.application.groupBy({ by: ['status'], _count: { id: true } }),
        prisma.auditLog.findMany({ take: 6, orderBy: { createdAt: 'desc' } }),
        prisma.jobSkill.groupBy({ by: ['skillName'], _count: { id: true }, take: 8, orderBy: { _count: { id: 'desc' } } }),
        prisma.application.findMany({
          where: {
            interviews: {
              some: { status: 'COMPLETED' }
            }
          },
          include: {
            job: { select: { id: true, title: true, companyName: true } },
            candidate: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                assessments: {
                  take: 1,
                  orderBy: { assessedAt: 'desc' },
                  include: { skillAssessments: true, report: true }
                }
              }
            },
            interviews: {
              where: { status: 'COMPLETED' },
              take: 1,
              orderBy: { scheduledEndTime: 'desc' },
              include: {
                participants: {
                  where: { participantRole: 'INTERVIEWER' },
                  include: { user: { select: { name: true, email: true } } }
                },
                assessmentReport: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 10
        })
      ]);

      const pendingEvaluations = evaluatedApplications.map((app: any) => {
        const completedInterview = app.interviews?.[0];
        const assessment = app.candidate?.assessments?.[0];
        const report = completedInterview?.assessmentReport || assessment?.report;
        let parsedReport: any = {};
        if (report?.reportData) {
          try {
            parsedReport = JSON.parse(report.reportData);
          } catch {
            parsedReport = {};
          }
        }

        const interviewerUser = completedInterview?.participants?.[0]?.user;
        const skills = (assessment?.skillAssessments && assessment.skillAssessments.length > 0)
          ? assessment.skillAssessments.map((s: any) => ({ skillName: s.skillName, score: s.score, level: s.level }))
          : (parsedReport.skills || []);

        const aiScore = (parsedReport.aiScore !== undefined && parsedReport.aiScore !== null)
          ? Number(parsedReport.aiScore)
          : ((assessment?.resumeScore !== undefined && assessment?.resumeScore !== null) ? Number(assessment.resumeScore) : 0);
        const technicalScore = (parsedReport.technicalScore !== undefined && parsedReport.technicalScore !== null)
          ? Number(parsedReport.technicalScore)
          : ((assessment?.technicalScore !== undefined && assessment?.technicalScore !== null) ? Number(assessment.technicalScore) : 0);
        const communicationScore = (parsedReport.communicationScore !== undefined && parsedReport.communicationScore !== null)
          ? Number(parsedReport.communicationScore)
          : ((assessment?.interviewScore !== undefined && assessment?.interviewScore !== null) ? Number(assessment.interviewScore) : 0);
        const overallScore = (parsedReport.overallScore !== undefined && parsedReport.overallScore !== null)
          ? Number(parsedReport.overallScore)
          : Math.round(aiScore * 0.4 + technicalScore * 0.4 + communicationScore * 0.2);

        return {
          applicationId: app.id,
          candidateId: app.candidateId,
          candidateUserId: app.candidate?.user?.id,
          candidateName: app.candidate?.user?.name || 'Candidate',
          candidateEmail: app.candidate?.user?.email || 'email@example.com',
          jobId: app.jobId,
          jobTitle: app.job?.title || 'Technical Role',
          companyName: app.job?.companyName || 'Corporate Tech',
          status: app.status,
          appliedAt: app.appliedAt,
          interviewerName: interviewerUser?.name || parsedReport.interviewerName || 'Technical Evaluator',
          interviewDate: completedInterview?.actualEndTime || completedInterview?.scheduledEndTime,
          recommendation: app.status === 'OFFERED' ? 'OFFERED' : app.status === 'REJECTED' ? 'REJECTED' : 'PENDING_DECISION',
          aiScore,
          technicalScore,
          communicationScore,
          overallScore,
          skills,
          strengths: parsedReport.strengths || parsedReport.strengthsFeedback || assessment?.strengthsSummary || '',
          improvements: parsedReport.improvements || parsedReport.weaknessesFeedback || assessment?.weaknessesSummary || '',
          evaluatorNotes: parsedReport.notes || parsedReport.evaluatorNotes || '',
          reportId: report?.id
        };
      });

      const avgScore = assessments.length > 0
        ? Math.round(assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length)
        : 0;

      // Group applications by job
      const jobsWithAppCount = await prisma.job.findMany({
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
        recentActivities,
        pendingEvaluations
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPerformanceAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [interviews, assessments, skills] = await Promise.all([
        prisma.interview.findMany({ select: { status: true, interviewType: true, scheduledStartTime: true } }),
        prisma.candidateAssessment.findMany({
          select: { technicalScore: true, interviewScore: true, resumeScore: true, overallScore: true }
        }),
        prisma.skillAssessment.findMany({ select: { skillName: true, score: true } })
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
      const skillGroups: Record<string, { total: number; count: number }> = {};
      skills.forEach(s => {
        if (!skillGroups[s.skillName]) skillGroups[s.skillName] = { total: 0, count: 0 };
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
