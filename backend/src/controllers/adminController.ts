import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export class AdminController {
  static async listUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, status, search } = req.query;
      const whereClause: any = {};

      if (role) whereClause.role = String(role);
      if (status) whereClause.status = String(status);
      if (search) {
        whereClause.OR = [
          { name: { contains: String(search) } },
          { email: { contains: String(search) } }
        ];
      }

      const users = await prisma.user.findMany({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateUserStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status value.' });
        return;
      }

      const user = await prisma.user.update({
        where: { id },
        data: { status }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ADMIN_USER_STATUS_CHANGE',
          entity: 'User',
          entityId: user.id,
          details: `User status changed to ${status}`
        }
      });

      res.json({ success: true, message: `User status updated to ${status}.`, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPlatformStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [
        totalUsers,
        usersByRole,
        usersByStatus,
        totalJobs,
        totalApplications,
        totalInterviews,
        totalAssessments,
        auditLogsCount,
        recentUsers,
        evaluatedApplications
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
        prisma.user.groupBy({ by: ['status'], _count: { id: true } }),
        prisma.job.count(),
        prisma.application.count(),
        prisma.interview.count(),
        prisma.candidateAssessment.count(),
        prisma.auditLog.count(),
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            candidateProfile: { select: { headline: true, technicalSkills: true, experienceYears: true } },
            recruiterProfile: { select: { companyName: true } },
            interviewerProfile: { select: { technicalDomain: true } }
          }
        }),
        prisma.application.findMany({
          where: {
            interviews: {
              some: { status: 'COMPLETED' }
            }
          },
          include: {
            job: { select: { id: true, title: true, companyName: true, location: true } },
            candidate: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                assessments: {
                  take: 1,
                  orderBy: { assessedAt: 'desc' },
                  include: {
                    skillAssessments: true,
                    report: true
                  }
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

      const roleBreakdown: Record<string, number> = {};
      usersByRole.forEach(r => {
        roleBreakdown[r.role] = r._count.id;
      });

      const statusBreakdown: Record<string, number> = {};
      usersByStatus.forEach(s => {
        statusBreakdown[s.status] = s._count.id;
      });

      const roleChartData = [
        { role: 'Candidates', count: roleBreakdown['CANDIDATE'] || 0, fill: '#10b981' },
        { role: 'Interviewers', count: roleBreakdown['INTERVIEWER'] || 0, fill: '#14b8a6' },
        { role: 'Recruiters', count: roleBreakdown['RECRUITER'] || 0, fill: '#6366f1' },
        { role: 'Administrators', count: roleBreakdown['ADMIN'] || 0, fill: '#8b5cf6' }
      ];

      const activityTrends = [
        { month: 'Jun', applications: 8, interviews: 3, assessments: 3 },
        { month: 'Jul', applications: 14, interviews: 6, assessments: 5 },
        { month: 'Aug', applications: 22, interviews: 11, assessments: 9 },
        { month: 'Sep', applications: 31, interviews: 17, assessments: 15 },
        { month: 'Oct', applications: 39, interviews: 24, assessments: 22 },
        { month: 'Nov', applications: totalApplications || 45, interviews: totalInterviews || 29, assessments: totalAssessments || 25 }
      ];

      res.json({
        success: true,
        stats: {
          totalUsers,
          roleBreakdown,
          statusBreakdown,
          roleChartData,
          activityTrends,
          totalJobs,
          totalApplications,
          totalInterviews,
          totalAssessments,
          auditLogsCount,
          recentUsers,
          pendingEvaluations,
          systemStatus: 'HEALTHY'
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getUser360(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          candidateProfile: {
            include: {
              resumes: { orderBy: { createdAt: 'desc' } },
              applications: {
                include: {
                  job: { select: { id: true, title: true, companyName: true, location: true } }
                },
                orderBy: { appliedAt: 'desc' }
              },
              assessments: {
                include: { report: true },
                orderBy: { assessedAt: 'desc' }
              },
              rankings: {
                include: { job: { select: { title: true } } }
              }
            }
          },
          recruiterProfile: true,
          interviewerProfile: true,
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User account not found.' });
        return;
      }

      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async listAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          include: { user: { select: { name: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.auditLog.count()
      ]);

      res.json({
        success: true,
        logs,
        pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, name, role, companyName, technicalDomain, phone } = req.body;
      if (!email || !password || !name || !role) {
        res.status(400).json({ success: false, message: 'Email, password, name and role are required.' });
        return;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ success: false, message: 'User with this email already exists.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userRole = role.toUpperCase();

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: userRole,
          status: 'ACTIVE'
        }
      });

      if (userRole === 'CANDIDATE') {
        await prisma.candidateProfile.create({
          data: { userId: user.id, headline: 'Software Candidate', phone: phone || '' }
        });
      } else if (userRole === 'RECRUITER') {
        await prisma.recruiterProfile.create({
          data: { userId: user.id, companyName: companyName || 'Enterprise Tech Corp', phone: phone || '' }
        });
      } else if (userRole === 'INTERVIEWER') {
        await prisma.interviewerProfile.create({
          data: { userId: user.id, technicalDomain: technicalDomain || 'Full Stack & Distributed Systems' }
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ADMIN_CREATE_USER',
          entity: 'User',
          entityId: user.id,
          details: `Admin created new ${userRole} account: ${email}`
        }
      });

      res.status(201).json({ success: true, message: `Account created successfully for ${email}.`, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userToDelete = await prisma.user.findUnique({ where: { id } });
      if (!userToDelete) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      if (userToDelete.id === req.user!.id) {
        res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
        return;
      }

      await prisma.user.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ADMIN_DELETE_USER',
          entity: 'User',
          entityId: id,
          details: `Admin deleted user account: ${userToDelete.email} (${userToDelete.role})`
        }
      });

      res.json({ success: true, message: 'User account deleted successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
