"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentController = void 0;
const prisma_1 = require("../utils/prisma");
const aiService_1 = require("../services/aiService");
class AssessmentController {
    static async submitAndEvaluateAnswer(req, res) {
        try {
            const { interviewId, questionId, candidateAnswerText, timeTakenSeconds = 0 } = req.body;
            if (!interviewId || !questionId || !candidateAnswerText) {
                res.status(400).json({ success: false, message: 'interviewId, questionId, and candidateAnswerText are required.' });
                return;
            }
            const question = await prisma_1.prisma.interviewQuestion.findUnique({ where: { id: questionId } });
            if (!question) {
                res.status(404).json({ success: false, message: 'Question not found.' });
                return;
            }
            let expectedConceptsList = [];
            try {
                expectedConceptsList = JSON.parse(question.expectedConcepts);
            }
            catch {
                expectedConceptsList = question.expectedConcepts.split(',').map(s => s.trim());
            }
            // 1. Call AI Answer Evaluation
            const evalResult = await aiService_1.AIService.evaluateAnswer(question.title, question.description, question.skillEvaluated, expectedConceptsList, candidateAnswerText, question.evaluationCriteria || undefined);
            // 2. Persist Interview Answer
            const answer = await prisma_1.prisma.interviewAnswer.create({
                data: {
                    interviewId,
                    questionId,
                    candidateAnswerText,
                    timeTakenSeconds: parseInt(timeTakenSeconds, 10),
                    evaluation: {
                        create: {
                            technicalCorrectness: evalResult.metrics.technical_correctness,
                            semanticRelevance: evalResult.metrics.semantic_relevance,
                            conceptualUnderstanding: evalResult.metrics.conceptual_understanding,
                            completeness: evalResult.metrics.completeness,
                            keywordCoverage: evalResult.metrics.keyword_coverage,
                            finalScore: evalResult.overall_score,
                            strengthsFeedback: evalResult.strengths,
                            missingConcepts: Array.isArray(evalResult.missing_concepts)
                                ? evalResult.missing_concepts.join(', ')
                                : String(evalResult.missing_concepts || ''),
                            improvementAreas: evalResult.improvement_areas,
                            modelUsed: evalResult.evaluation_model || 'ScikitLearn-NLP-Rubric-v1'
                        }
                    }
                },
                include: { evaluation: true, question: true }
            });
            res.status(201).json({
                success: true,
                message: 'Answer submitted and AI evaluated successfully.',
                answer,
                evaluation: answer.evaluation
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async overrideScore(req, res) {
        try {
            const { answerId } = req.params;
            const { humanOverrideScore, overrideReason } = req.body;
            if (humanOverrideScore === undefined || !overrideReason) {
                res.status(400).json({ success: false, message: 'humanOverrideScore and overrideReason are required.' });
                return;
            }
            const evaluation = await prisma_1.prisma.answerEvaluation.update({
                where: { answerId },
                data: {
                    humanOverrideScore: parseFloat(humanOverrideScore),
                    overrideReason,
                    evaluatorId: req.user.id
                }
            });
            // Audit Log for override transparency
            await prisma_1.prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'EVALUATION_SCORE_OVERRIDE',
                    entity: 'AnswerEvaluation',
                    entityId: evaluation.id,
                    details: `Score manually adjusted to ${humanOverrideScore}. Reason: ${overrideReason}`
                }
            });
            res.json({ success: true, message: 'Interviewer score override saved.', evaluation });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async finalizeAssessment(req, res) {
        try {
            const { interviewId, recruiterRecommendation = 'HIRE' } = req.body;
            const interview = await prisma_1.prisma.interview.findUnique({
                where: { id: interviewId },
                include: {
                    answers: { include: { evaluation: true, question: true } },
                    application: {
                        include: {
                            candidate: { include: { user: true } },
                            job: { include: { skills: true } },
                            resumeAnalyses: { take: 1, orderBy: { analyzedAt: 'desc' } }
                        }
                    }
                }
            });
            if (!interview) {
                res.status(404).json({ success: false, message: 'Interview not found.' });
                return;
            }
            const answers = interview.answers;
            let totalScore = 0;
            const skillScoreMap = {};
            answers.forEach(a => {
                const score = a.evaluation?.humanOverrideScore ?? a.evaluation?.finalScore ?? 0;
                totalScore += score;
                const skill = a.question.skillEvaluated || 'General';
                if (!skillScoreMap[skill]) {
                    skillScoreMap[skill] = { total: 0, count: 0 };
                }
                skillScoreMap[skill].total += score;
                skillScoreMap[skill].count += 1;
            });
            const avgInterviewScore = answers.length > 0 ? Math.round(totalScore / answers.length) : 75;
            const resumeScore = interview.application.resumeAnalyses[0]?.compatibilityScore ?? 80;
            const technicalScore = avgInterviewScore;
            const compositeScore = Math.round(technicalScore * 0.4 + avgInterviewScore * 0.4 + resumeScore * 0.2);
            // Create CandidateAssessment
            const candidateAssessment = await prisma_1.prisma.candidateAssessment.create({
                data: {
                    candidateId: interview.application.candidateId,
                    applicationId: interview.applicationId,
                    technicalScore,
                    interviewScore: avgInterviewScore,
                    resumeScore,
                    overallScore: compositeScore,
                    strengthsSummary: `Demonstrated solid competency across ${Object.keys(skillScoreMap).join(', ')}.`,
                    weaknessesSummary: 'Review detailed rubric feedback on deeper edge cases.',
                    status: 'COMPLETED'
                }
            });
            // Create individual SkillAssessments
            for (const [skillName, data] of Object.entries(skillScoreMap)) {
                await prisma_1.prisma.skillAssessment.create({
                    data: {
                        candidateId: interview.application.candidateId,
                        assessmentId: candidateAssessment.id,
                        skillName,
                        score: Math.round(data.total / data.count),
                        level: 'INTERMEDIATE'
                    }
                });
            }
            // Mark interview as COMPLETED
            await prisma_1.prisma.interview.update({
                where: { id: interviewId },
                data: { status: 'COMPLETED', actualEndTime: new Date() }
            });
            // Create AssessmentReport record
            const report = await prisma_1.prisma.assessmentReport.create({
                data: {
                    interviewId: interview.id,
                    assessmentId: candidateAssessment.id,
                    recruiterRecommendation,
                    reportData: JSON.stringify({
                        candidateName: interview.application.candidate.user.name,
                        candidateEmail: interview.application.candidate.user.email,
                        jobTitle: interview.application.job.title,
                        companyName: interview.application.job.companyName,
                        interviewDate: new Date().toLocaleDateString(),
                        overallScore: compositeScore,
                        technicalScore,
                        interviewScore: avgInterviewScore,
                        resumeScore,
                        skills: Object.entries(skillScoreMap).map(([name, d]) => ({
                            name,
                            score: Math.round(d.total / d.count)
                        })),
                        answers: answers.map(a => ({
                            questionTitle: a.question.title,
                            score: a.evaluation?.humanOverrideScore ?? a.evaluation?.finalScore ?? 0,
                            answerText: a.candidateAnswerText,
                            strengths: a.evaluation?.strengthsFeedback || 'Solid answer.',
                            improvements: a.evaluation?.improvementAreas || 'None noted.'
                        })),
                        recommendation: recruiterRecommendation,
                        summaryFeedback: `Candidate evaluated with overall score ${compositeScore}/100.`
                    })
                }
            });
            res.json({
                success: true,
                message: 'Assessment finalized and report compiled.',
                assessment: candidateAssessment,
                report
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getAssessmentById(req, res) {
        try {
            const { id } = req.params;
            const assessment = await prisma_1.prisma.candidateAssessment.findUnique({
                where: { id },
                include: {
                    skillAssessments: true,
                    report: true,
                    candidate: { include: { user: { select: { name: true, email: true } } } },
                    application: { include: { job: true } }
                }
            });
            if (!assessment) {
                res.status(404).json({ success: false, message: 'Assessment record not found.' });
                return;
            }
            res.json({ success: true, assessment });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AssessmentController = AssessmentController;
