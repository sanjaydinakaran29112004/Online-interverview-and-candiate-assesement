import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { AIService } from '../services/aiService';

export class ResumeController {
  static async uploadAndAnalyze(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = req.file;
      const { jobId, applicationId, rawText } = req.body;

      let candidateProfile = await prisma.candidateProfile.findUnique({
        where: { userId: req.user!.id }
      });

      if (!candidateProfile) {
        candidateProfile = await prisma.candidateProfile.create({
          data: { userId: req.user!.id, headline: 'Candidate' }
        });
      }

      // 1. Parse resume through AI service
      const parsed = await AIService.parseResume(file?.path, rawText);

      // 2. Persist Resume
      const resume = await prisma.resume.create({
        data: {
          candidateId: candidateProfile.id,
          fileName: file?.filename || 'manual_entry.txt',
          originalName: file?.originalname || 'Candidate Resume',
          fileUrl: file ? `/uploads/${file.filename}` : '',
          fileSize: file?.size || (rawText?.length || 0),
          mimeType: file?.mimetype || 'text/plain',
          extractedText: parsed.extracted_text || rawText || ''
        }
      });

      // Update candidate profile skills & experience if extracted
      if (parsed.skills?.all_skills?.length > 0) {
        await prisma.candidateProfile.update({
          where: { id: candidateProfile.id },
          data: {
            technicalSkills: parsed.skills.all_skills.join(', '),
            experienceYears: parsed.experience_years || candidateProfile.experienceYears,
            education: parsed.education?.join('; ') || candidateProfile.education
          }
        });
      }

      let analysisResult = null;

      // 3. If jobId provided, run Job-Resume Matching
      if (jobId) {
        const job = await prisma.job.findUnique({
          where: { id: jobId },
          include: { skills: true }
        });

        if (job) {
          const requiredSkills = job.skills.map(s => s.skillName);
          const resumeTextForMatch = parsed.extracted_text || rawText || 'Candidate technical resume profile';
          const match = await AIService.matchJob(
            resumeTextForMatch,
            job.description,
            requiredSkills,
            parsed.skills?.all_skills
          );

          analysisResult = await prisma.resumeAnalysis.create({
            data: {
              resumeId: resume.id,
              applicationId: applicationId || null,
              extractedSkills: JSON.stringify(parsed.skills?.all_skills || []),
              matchedSkills: JSON.stringify(match.matched_skills || []),
              missingSkills: JSON.stringify(match.missing_skills || []),
              experienceSummary: `Extracted ${parsed.experience_years} years experience. Education: ${parsed.education?.join(', ') || 'N/A'}.`,
              compatibilityScore: match.compatibility_score,
              scoreExplanation: match.explanation,
              rawAiOutput: JSON.stringify(match)
            }
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Resume parsed and analyzed successfully.',
        resume,
        parsedData: parsed,
        analysis: analysisResult
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAnalysisByResumeId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const analysis = await prisma.resumeAnalysis.findFirst({
        where: { resumeId: id },
        include: { resume: true, application: { include: { job: true } } }
      });

      if (!analysis) {
        res.status(404).json({ success: false, message: 'Analysis not found.' });
        return;
      }

      res.json({
        success: true,
        analysis: {
          ...analysis,
          extractedSkills: JSON.parse(analysis.extractedSkills || '[]'),
          matchedSkills: JSON.parse(analysis.matchedSkills || '[]'),
          missingSkills: JSON.parse(analysis.missingSkills || '[]')
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
