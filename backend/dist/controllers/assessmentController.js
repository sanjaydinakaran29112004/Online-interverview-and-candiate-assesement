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
            const { interviewId, recruiterRecommendation = 'HIRE', notes = '', strengths = '', improvements = '', interviewerSkillScores = [] } = req.body;
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
            // Integrate explicit interviewer evaluated skill percentages
            if (Array.isArray(interviewerSkillScores) && interviewerSkillScores.length > 0) {
                interviewerSkillScores.forEach((sk) => {
                    if (sk.skillName && sk.score !== undefined) {
                        skillScoreMap[sk.skillName] = { total: Number(sk.score), count: 1 };
                    }
                });
            }
            // If no skills scored yet, initialize from Job requirements
            if (Object.keys(skillScoreMap).length === 0) {
                const jobSkills = interview.application.job.skills || [];
                if (jobSkills.length > 0) {
                    jobSkills.forEach(js => {
                        skillScoreMap[js.skillName] = { total: 80, count: 1 };
                    });
                }
                else {
                    skillScoreMap['Technical Knowledge'] = { total: 80, count: 1 };
                    skillScoreMap['Problem Solving'] = { total: 75, count: 1 };
                    skillScoreMap['Communication'] = { total: 85, count: 1 };
                }
            }
            let totalSkillScore = 0;
            let skillCount = 0;
            for (const data of Object.values(skillScoreMap)) {
                totalSkillScore += data.total / data.count;
                skillCount++;
            }
            const avgInterviewScore = skillCount > 0 ? Math.round(totalSkillScore / skillCount) : 78;
            const resumeScore = interview.application.resumeAnalyses[0]?.compatibilityScore ?? 80;
            const technicalScore = avgInterviewScore;
            const compositeScore = Math.round(technicalScore * 0.4 + avgInterviewScore * 0.4 + resumeScore * 0.2);
            // Clean up previous assessment report if re-finalized
            const existingReport = await prisma_1.prisma.assessmentReport.findUnique({
                where: { interviewId: interview.id }
            });
            if (existingReport) {
                await prisma_1.prisma.assessmentReport.delete({ where: { id: existingReport.id } });
            }
            // Create CandidateAssessment
            const candidateAssessment = await prisma_1.prisma.candidateAssessment.create({
                data: {
                    candidateId: interview.application.candidateId,
                    applicationId: interview.applicationId,
                    technicalScore: avgInterviewScore,
                    interviewScore: avgInterviewScore,
                    resumeScore,
                    overallScore: compositeScore,
                    strengthsSummary: strengths || notes || `Demonstrated solid competency across ${Object.keys(skillScoreMap).join(', ') || 'core software engineering concepts'}.`,
                    weaknessesSummary: improvements || 'Continue refining edge case handling and architectural performance optimizations.',
                    status: 'COMPLETED'
                }
            });
            // Create individual SkillAssessments with exact percentage
            for (const [skillName, data] of Object.entries(skillScoreMap)) {
                const sc = Math.round(data.total / data.count);
                const level = sc >= 85 ? 'EXPERT' : sc >= 70 ? 'ADVANCED' : sc >= 50 ? 'INTERMEDIATE' : 'BEGINNER';
                await prisma_1.prisma.skillAssessment.create({
                    data: {
                        candidateId: interview.application.candidateId,
                        assessmentId: candidateAssessment.id,
                        skillName,
                        score: sc,
                        level
                    }
                });
            }
            // Mark interview as COMPLETED
            await prisma_1.prisma.interview.update({
                where: { id: interviewId },
                data: { status: 'COMPLETED', actualEndTime: new Date() }
            });
            // Map recommendation to applicant stage: sets to pending review with recommendation
            const stageMap = {
                STRONG_HIRE: 'RECOMMENDED_HIRE',
                HIRE: 'RECOMMENDED_HIRE',
                NEXT_ROUND: 'TECHNICAL_ROUND_2',
                HOLD: 'UNDER_REVIEW',
                REJECT: 'REJECTED'
            };
            const updatedStatus = stageMap[recruiterRecommendation] || 'RECOMMENDED_HIRE';
            // Update candidate application status
            await prisma_1.prisma.application.update({
                where: { id: interview.applicationId },
                data: { status: updatedStatus }
            });
            // Create AssessmentReport record with interviewer feedback & skill percentages
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
                        interviewerName: req.user.name,
                        interviewDate: new Date().toLocaleDateString(),
                        overallScore: compositeScore,
                        technicalScore: avgInterviewScore,
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
                        strengthsFeedback: strengths || notes,
                        weaknessesFeedback: improvements,
                        evaluatorNotes: notes,
                        summaryFeedback: notes || `Candidate evaluated by ${req.user.name} with overall score ${compositeScore}/100. Evaluator Recommendation: ${recruiterRecommendation.replace('_', ' ')}.`
                    })
                }
            });
            // Update or create Algorithmic Ranking record for this opening
            await prisma_1.prisma.candidateRanking.upsert({
                where: {
                    jobId_candidateId: {
                        jobId: interview.application.jobId,
                        candidateId: interview.application.candidateId
                    }
                },
                update: {
                    compositeScore,
                    interviewScore: avgInterviewScore,
                    skillMatchScore: resumeScore,
                    recruitmentStage: updatedStatus,
                    rankExplanation: `Final evaluation score ${compositeScore}/100. Evaluator: ${req.user.name}. Recommendation: ${recruiterRecommendation.replace('_', ' ')}`,
                    updatedAt: new Date()
                },
                create: {
                    jobId: interview.application.jobId,
                    candidateId: interview.application.candidateId,
                    overallRank: 1,
                    compositeScore,
                    interviewScore: avgInterviewScore,
                    skillMatchScore: resumeScore,
                    recruitmentStage: updatedStatus,
                    rankExplanation: `Final evaluation score ${compositeScore}/100. Evaluator: ${req.user.name}. Recommendation: ${recruiterRecommendation.replace('_', ' ')}`
                }
            });
            // Create Candidate Notification
            await prisma_1.prisma.notification.create({
                data: {
                    userId: interview.application.candidate.user.id,
                    title: 'Technical Assessment Concluded',
                    message: `Your technical evaluation for ${interview.application.job.title} has been finalized by evaluator ${req.user.name}. Stage: ${updatedStatus.replace(/_/g, ' ')}.`,
                    type: 'ASSESSMENT',
                    link: '/candidate/assessments'
                }
            });
            // Security Audit Trail
            await prisma_1.prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'ASSESSMENT_CONCLUDED',
                    entity: 'Interview',
                    entityId: interview.id,
                    details: `Evaluator ${req.user.name} concluded interview. Recommendation: ${recruiterRecommendation}, Score: ${compositeScore}/100, Stage: ${updatedStatus}`
                }
            });
            res.json({
                success: true,
                message: 'Assessment finalized and report compiled.',
                assessment: candidateAssessment,
                report,
                applicationStatus: updatedStatus
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
