import { Response } from 'express';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { ReportGenerator } from '../services/reportGenerator';

export class ReportController {
  static async getReportById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const report = await prisma.assessmentReport.findUnique({
        where: { id },
        include: {
          interview: {
            include: {
              application: {
                include: {
                  candidate: { include: { user: { select: { name: true, email: true } } } },
                  job: true
                }
              }
            }
          },
          assessment: { include: { skillAssessments: true } }
        }
      });

      if (!report) {
        res.status(404).json({ success: false, message: 'Assessment report not found.' });
        return;
      }

      res.json({
        success: true,
        report: {
          ...report,
          parsedData: JSON.parse(report.reportData || '{}')
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async downloadReportPDF(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const report = await prisma.assessmentReport.findUnique({
        where: { id },
        include: {
          interview: {
            include: {
              answers: { include: { question: true, evaluation: true } },
              application: {
                include: {
                  candidate: { include: { user: true } },
                  job: true
                }
              }
            }
          },
          assessment: { include: { skillAssessments: true } }
        }
      });

      if (!report) {
        res.status(404).json({ success: false, message: 'Report not found.' });
        return;
      }

      let parsedData = JSON.parse(report.reportData || '{}');

      // Sync latest application status and recommendation
      const appStatus = report.interview?.application?.status;
      const rec = report.recruiterRecommendation;
      let finalRecommendation = 'AWAITING DECISION';
      if (appStatus === 'OFFERED' || appStatus === 'ACCEPTED' || rec === 'OFFERED' || rec === 'ACCEPTED') {
        finalRecommendation = 'OFFERED (ACCEPTED)';
      } else if (appStatus === 'REJECTED' || rec === 'REJECTED') {
        finalRecommendation = 'REJECTED';
      } else if (appStatus === 'ASSESSMENT_COMPLETED') {
        finalRecommendation = 'ASSESSMENT COMPLETED';
      }

      // Ensure data structure
      const reportPayload = {
        candidateName: parsedData.candidateName || report.interview?.application?.candidate?.user?.name || 'Candidate',
        candidateEmail: parsedData.candidateEmail || report.interview?.application?.candidate?.user?.email || 'email@example.com',
        jobTitle: parsedData.jobTitle || report.interview?.application?.job?.title || 'Software Engineer',
        companyName: parsedData.companyName || report.interview?.application?.job?.companyName || 'Enterprise Tech',
        interviewDate: parsedData.interviewDate || new Date(report.generatedAt).toLocaleDateString(),
        overallScore: parsedData.overallScore ?? report.assessment?.overallScore ?? 0,
        technicalScore: parsedData.technicalScore ?? report.assessment?.technicalScore ?? 0,
        interviewScore: parsedData.communicationScore ?? parsedData.interviewScore ?? report.assessment?.interviewScore ?? 0,
        resumeScore: parsedData.aiScore ?? parsedData.resumeScore ?? report.assessment?.resumeScore ?? 0,
        skills: (parsedData.skills && parsedData.skills.length > 0)
          ? parsedData.skills
          : [
              { name: 'AI Technical Assessment', score: parsedData.aiScore ?? 0 },
              { name: 'Technical Depth & Reasoning', score: parsedData.technicalScore ?? 0 },
              { name: 'Communication & Articulation', score: parsedData.communicationScore ?? 0 }
            ],
        answers: (parsedData.answers || []).map((a: any) => ({
          questionTitle: a.questionTitle || a.question?.title || 'Technical Question',
          score: a.score ?? a.evaluation?.finalScore ?? 0,
          answerText: a.answerText || a.candidateAnswerText || '',
          strengths: a.strengths || a.evaluation?.strengthsFeedback || 'Solid answer.',
          improvements: a.improvements || a.evaluation?.improvementAreas || 'None noted.'
        })),
        recommendation: finalRecommendation,
        summaryFeedback: parsedData.summaryFeedback || 'Assessment completed with explainable criteria.'
      };

      const pdfPath = await ReportGenerator.generatePDF(report.id, reportPayload);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=assessment-report-${report.id}.pdf`);

      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
