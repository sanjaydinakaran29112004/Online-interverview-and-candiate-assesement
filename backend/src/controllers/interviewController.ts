import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export class InterviewController {
  static async scheduleInterview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        applicationId,
        title,
        interviewType = 'ONLINE_VIDEO',
        scheduledStartTime,
        scheduledEndTime,
        interviewerIds = [],
        meetingNotes
      } = req.body;

      if (!applicationId || !scheduledStartTime || !scheduledEndTime) {
        res.status(400).json({ success: false, message: 'applicationId, scheduledStartTime, and scheduledEndTime are required.' });
        return;
      }

      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { candidate: { include: { user: true } }, job: true }
      });

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found.' });
        return;
      }

      // Generate a readable unique roomCode (e.g. room-abc123xyz)
      const roomCode = `room-${uuidv4().substring(0, 8)}`;

      const interview = await prisma.interview.create({
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
                userId: req.user!.id,
                participantRole: 'RECRUITER'
              },
              // Additional assigned interviewers
              ...interviewerIds.map((uId: string) => ({
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
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'INTERVIEW_SCHEDULED' }
      });

      // Notify candidate
      await prisma.notification.create({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async listInterviews(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const whereClause: any = {};

      if (status) whereClause.status = String(status);

      if (req.user!.role === 'CANDIDATE') {
        const profile = await prisma.candidateProfile.findUnique({ where: { userId: req.user!.id } });
        if (profile) {
          whereClause.application = { candidateId: profile.id };
        }
      } else if (req.user!.role === 'INTERVIEWER') {
        whereClause.participants = { some: { userId: req.user!.id } };
      }

      const interviews = await prisma.interview.findMany({
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
        orderBy: { scheduledStartTime: 'asc' }
      });

      res.json({ success: true, interviews });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getInterviewByRoom(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomCode } = req.params;
      const interview = await prisma.interview.findUnique({
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
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const data: any = { status };
      if (status === 'IN_PROGRESS') data.actualStartTime = new Date();
      if (status === 'COMPLETED') data.actualEndTime = new Date();

      const interview = await prisma.interview.update({
        where: { id },
        data
      });

      res.json({ success: true, message: `Interview status changed to ${status}.`, interview });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async recordConsent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { consent } = req.body;

      await prisma.interviewParticipant.updateMany({
        where: {
          interviewId: id,
          userId: req.user!.id
        },
        data: { consentGiven: Boolean(consent) }
      });

      res.json({ success: true, message: 'Recording consent recorded.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
