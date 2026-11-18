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

      // Ensure data structure
      const reportPayload = {
        candidateName: parsedData.candidateName || report.interview?.application?.candidate?.user?.name || 'Candidate',
        candidateEmail: parsedData.candidateEmail || report.interview?.application?.candidate?.user?.email || 'email@example.com',
        jobTitle: parsedData.jobTitle || report.interview?.application?.job?.title || 'Software Engineer',
        companyName: parsedData.companyName || report.interview?.application?.job?.companyName || 'Enterprise Tech',
        interviewDate: parsedData.interviewDate || new Date(report.generatedAt).toLocaleDateString(),
        overallScore: parsedData.overallScore ?? report.assessment?.overallScore ?? 80,
        technicalScore: parsedData.technicalScore ?? report.assessment?.technicalScore ?? 78,
        interviewScore: parsedData.interviewScore ?? report.assessment?.interviewScore ?? 82,
        resumeScore: parsedData.resumeScore ?? report.assessment?.resumeScore ?? 75,
        skills: parsedData.skills || (report.assessment?.skillAssessments || []).map(s => ({ name: s.skillName, score: s.score })),
        answers: parsedData.answers || (report.interview?.answers || []).map(a => ({
          questionTitle: a.question.title,
          score: a.evaluation?.humanOverrideScore ?? a.evaluation?.finalScore ?? 0,
          answerText: a.candidateAnswerText,
          strengths: a.evaluation?.strengthsFeedback || 'Solid answer.',
          improvements: a.evaluation?.improvementAreas || 'None noted.'
        })),
        recommendation: report.recruiterRecommendation || 'SHORTLISTED',
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
