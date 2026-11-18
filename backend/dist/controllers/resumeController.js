"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeController = void 0;
const prisma_1 = require("../utils/prisma");
const aiService_1 = require("../services/aiService");
class ResumeController {
    static async uploadAndAnalyze(req, res) {
        try {
            const file = req.file;
            const { jobId, applicationId, rawText } = req.body;
            let candidateProfile = await prisma_1.prisma.candidateProfile.findUnique({
                where: { userId: req.user.id }
            });
            if (!candidateProfile) {
                candidateProfile = await prisma_1.prisma.candidateProfile.create({
                    data: { userId: req.user.id, headline: 'Candidate' }
                });
            }
            // 1. Parse resume through AI service
            const parsed = await aiService_1.AIService.parseResume(file?.path, rawText);
            // 2. Persist Resume
            const resume = await prisma_1.prisma.resume.create({
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
                await prisma_1.prisma.candidateProfile.update({
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
                const job = await prisma_1.prisma.job.findUnique({
                    where: { id: jobId },
                    include: { skills: true }
                });
                if (job) {
                    const requiredSkills = job.skills.map(s => s.skillName);
                    const resumeTextForMatch = parsed.extracted_text || rawText || 'Candidate technical resume profile';
                    const match = await aiService_1.AIService.matchJob(resumeTextForMatch, job.description, requiredSkills, parsed.skills?.all_skills);
                    analysisResult = await prisma_1.prisma.resumeAnalysis.create({
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getAnalysisByResumeId(req, res) {
        try {
            const { id } = req.params;
            const analysis = await prisma_1.prisma.resumeAnalysis.findFirst({
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
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.ResumeController = ResumeController;
