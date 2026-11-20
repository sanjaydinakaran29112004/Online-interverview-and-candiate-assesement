import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export class ApplicationController {
  static async apply(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { jobId, coverLetter, resumeId } = req.body;
      if (!jobId) {
        res.status(400).json({ success: false, message: 'jobId is required.' });
        return;
      }

      let candidateProfile = await prisma.candidateProfile.findUnique({
        where: { userId: req.user!.id }
      });

      if (!candidateProfile) {
        candidateProfile = await prisma.candidateProfile.create({
          data: { userId: req.user!.id, headline: 'Software Candidate' }
        });
      }

      // Check for duplicate application
      const existing = await prisma.application.findFirst({
        where: {
          jobId,
          candidateId: candidateProfile.id
        }
      });

      if (existing) {
        res.status(409).json({ success: false, message: 'You have already applied for this job opening.' });
        return;
      }

      const application = await prisma.application.create({
        data: {
          jobId,
          candidateId: candidateProfile.id,
          coverLetter,
          status: 'APPLIED'
        },
        include: { job: true }
      });

      // Notify candidate
      await prisma.notification.create({
        data: {
          userId: req.user!.id,
          title: 'Application Submitted',
          message: `Your application for "${application.job.title}" has been successfully recorded.`,
          type: 'APPLICATION',
          link: `/candidate/applications`
        }
      });

      res.status(201).json({ success: true, message: 'Application submitted successfully.', application });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async listApplications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { jobId, status } = req.query;
      const whereClause: any = {};

      if (req.user!.role === 'CANDIDATE') {
        const profile = await prisma.candidateProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile) {
          res.json({ success: true, applications: [] });
          return;
        }
        whereClause.candidateId = profile.id;
      } else if (jobId) {
        whereClause.jobId = String(jobId);
      }

      if (status) {
        whereClause.status = String(status);
      }

      const applications = await prisma.application.findMany({
        where: whereClause,
        include: {
          job: {
            include: { skills: true }
          },
          candidate: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              resumes: { take: 1, orderBy: { createdAt: 'desc' } }
            }
          },
          resumeAnalyses: { take: 1, orderBy: { analyzedAt: 'desc' } },
          interviews: {
            include: {
              assessmentReport: true,
              participants: {
                include: {
                  user: { select: { id: true, name: true, role: true } }
                }
              }
            }
          },
          assessments: {
            include: {
              skillAssessments: true,
              report: true
            },
            take: 1,
            orderBy: { assessedAt: 'desc' }
          }
        },
        orderBy: { appliedAt: 'desc' }
      });

      res.json({ success: true, applications });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getApplicationById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          job: { include: { skills: true } },
          candidate: {
            include: {
              user: { select: { name: true, email: true } },
              resumes: true
            }
          },
          resumeAnalyses: true,
          interviews: {
            include: {
              assessmentReport: true,
              participants: { include: { user: { select: { name: true, role: true } } } }
            }
          },
          assessments: {
            include: {
              skillAssessments: true,
              report: true
            }
          }
        }
      });

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found.' });
        return;
      }

      res.json({ success: true, application });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const application = await prisma.application.update({
        where: { id },
        data: { status },
        include: {
          job: true,
          candidate: { include: { user: true } },
          interviews: { include: { assessmentReport: true } }
        }
      });

      // Synchronize assessment report recommendation
      const rec = status === 'OFFERED' || status === 'ACCEPTED' ? 'OFFERED' : status === 'REJECTED' ? 'REJECTED' : 'PENDING_DECISION';
      for (const inv of application.interviews || []) {
        if (inv.assessmentReport) {
          await prisma.assessmentReport.update({
            where: { id: inv.assessmentReport.id },
            data: { recruiterRecommendation: rec }
          });
        }
      }

      // Send notification to candidate
      await prisma.notification.create({
        data: {
          userId: application.candidate.userId,
          title: 'Application Status Updated',
          message: `Your application status for "${application.job.title}" is now: ${status}.`,
          type: 'APPLICATION',
          link: `/candidate/applications`
        }
      });

      // Broadcast status update in real-time to all connected users
      try {
        const io = req.app.get('io');
        if (io) {
          io.emit('application-status-updated', {
            applicationId: id,
            status,
            recommendation: rec,
            candidateUserId: application.candidate?.userId
          });
        }
      } catch (socketErr) {
        console.warn('Socket broadcast error:', socketErr);
      }

      res.json({ success: true, message: `Status updated to ${status}.`, application });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
