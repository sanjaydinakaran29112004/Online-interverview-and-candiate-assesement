"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingController = void 0;
const prisma_1 = require("../utils/prisma");
const aiService_1 = require("../services/aiService");
class RankingController {
    static async rankCandidatesForJob(req, res) {
        try {
            const { jobId } = req.params;
            const job = await prisma_1.prisma.job.findUnique({
                where: { id: jobId },
                include: {
                    skills: true,
                    applications: {
                        include: {
                            candidate: {
                                include: {
                                    user: { select: { id: true, name: true, email: true } },
                                    assessments: { take: 1, orderBy: { assessedAt: 'desc' }, include: { skillAssessments: true } },
                                    resumes: { take: 1, orderBy: { createdAt: 'desc' } }
                                }
                            },
                            resumeAnalyses: { take: 1, orderBy: { analyzedAt: 'desc' } }
                        }
                    }
                }
            });
            if (!job) {
                res.status(404).json({ success: false, message: 'Job not found.' });
                return;
            }
            const totalRequiredSkills = job.skills.length || 1;
            // Prepare candidate inputs for AI ranking engine
            const candidateInputs = job.applications.map(app => {
                const assessment = app.candidate.assessments[0];
                const analysis = app.resumeAnalyses[0];
                let matchedCount = 0;
                if (analysis?.matchedSkills) {
                    try {
                        matchedCount = JSON.parse(analysis.matchedSkills).length;
                    }
                    catch {
                        matchedCount = 1;
                    }
                }
                return {
                    candidate_id: app.candidate.id,
                    candidate_name: app.candidate.user.name,
                    resume_score: analysis?.compatibilityScore ?? 75,
                    technical_score: assessment?.technicalScore ?? 70,
                    interview_score: assessment?.interviewScore ?? 72,
                    years_experience: app.candidate.experienceYears ?? 2,
                    matched_skills_count: matchedCount,
                    total_required_skills: totalRequiredSkills
                };
            });
            // Call AI ranking engine
            const rankedItems = await aiService_1.AIService.rankCandidates(job.id, job.title, candidateInputs);
            // Persist or update in CandidateRanking table
            for (const item of rankedItems) {
                await prisma_1.prisma.candidateRanking.upsert({
                    where: {
                        jobId_candidateId: {
                            jobId: job.id,
                            candidateId: item.candidate_id
                        }
                    },
                    update: {
                        overallRank: item.rank,
                        compositeScore: item.composite_score,
                        skillMatchScore: item.resume_score,
                        interviewScore: item.interview_score,
                        experienceScore: Math.min(100, item.composite_score * 0.9),
                        rankExplanation: item.rank_explanation
                    },
                    create: {
                        jobId: job.id,
                        candidateId: item.candidate_id,
                        overallRank: item.rank,
                        compositeScore: item.composite_score,
                        skillMatchScore: item.resume_score,
                        interviewScore: item.interview_score,
                        experienceScore: Math.min(100, item.composite_score * 0.9),
                        rankExplanation: item.rank_explanation
                    }
                });
            }
            res.json({
                success: true,
                jobId: job.id,
                jobTitle: job.title,
                rankedCandidates: rankedItems
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async compareCandidates(req, res) {
        try {
            const { candidateIds } = req.query;
            if (!candidateIds) {
                res.status(400).json({ success: false, message: 'candidateIds parameter is required (comma separated).' });
                return;
            }
            const ids = String(candidateIds).split(',').map(s => s.trim());
            const candidates = await prisma_1.prisma.candidateProfile.findMany({
                where: { id: { in: ids } },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    assessments: {
                        take: 1,
                        orderBy: { assessedAt: 'desc' },
                        include: { skillAssessments: true }
                    },
                    resumes: { take: 1, orderBy: { createdAt: 'desc' } }
                }
            });
            // Normalize comparison metrics for Recharts Radar & Bar
            const comparisonData = candidates.map(c => {
                const assessment = c.assessments[0];
                const skills = assessment?.skillAssessments || [];
                return {
                    candidateId: c.id,
                    name: c.user.name,
                    headline: c.headline,
                    experienceYears: c.experienceYears,
                    overallScore: assessment?.overallScore ?? 75,
                    technicalScore: assessment?.technicalScore ?? 70,
                    interviewScore: assessment?.interviewScore ?? 72,
                    resumeScore: assessment?.resumeScore ?? 80,
                    skills: skills.map(sk => ({ skill: sk.skillName, score: sk.score }))
                };
            });
            res.json({ success: true, comparison: comparisonData });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.RankingController = RankingController;
