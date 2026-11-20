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
            // 2. Clean up previous answer for this question in this interview to prevent duplicates
            const existingAnswers = await prisma_1.prisma.interviewAnswer.findMany({
                where: { interviewId, questionId }
            });
            for (const ex of existingAnswers) {
                await prisma_1.prisma.interviewAnswer.delete({ where: { id: ex.id } });
            }
            // 3. Persist Interview Answer
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
            const { interviewId, aiScore, technicalScore = 80, communicationScore = 80, notes = '', strengths = '', improvements = '' } = req.body;
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
            // 1. Calculate AI Test Score (conducted in room by AI question evaluations)
            // Strictly respect evaluator/AI in-room score (even if 0 - e.g. for gibberish/empty answers)
            let computedAiScore = 0;
            if (aiScore !== undefined && aiScore !== null && !isNaN(Number(aiScore))) {
                computedAiScore = Math.max(0, Math.min(100, Math.round(Number(aiScore))));
            }
            else if (answers.length > 0) {
                const evalScores = answers.map(a => a.evaluation?.humanOverrideScore ?? a.evaluation?.finalScore ?? 0);
                if (evalScores.length > 0) {
                    computedAiScore = Math.round(evalScores.reduce((a, b) => a + b, 0) / evalScores.length);
                }
            }
            // Deduplicate answers by questionId, picking the latest evaluation
            const uniqueAnswersMap = new Map();
            for (const a of answers) {
                uniqueAnswersMap.set(a.questionId, a);
            }
            const uniqueAnswers = Array.from(uniqueAnswersMap.values());
            // 2. Technical Score and Communication Score (given by Interviewer)
            const techScore = Math.min(100, Math.max(0, Number(technicalScore) || 80));
            const commScore = Math.min(100, Math.max(0, Number(communicationScore) || 80));
            // 3. 3-Way Composite Score
            // AI Test Score (40%) + Technical Score (40%) + Communication Score (20%)
            const compositeScore = Math.round((computedAiScore * 0.4) + (techScore * 0.4) + (commScore * 0.2));
            // Clean up previous assessment report if re-finalized
            const existingReport = await prisma_1.prisma.assessmentReport.findUnique({
                where: { interviewId: interview.id }
            });
            if (existingReport) {
                await prisma_1.prisma.assessmentReport.delete({ where: { id: existingReport.id } });
            }
            // Create CandidateAssessment with the 3 scores
            const candidateAssessment = await prisma_1.prisma.candidateAssessment.create({
                data: {
                    candidateId: interview.application.candidateId,
                    applicationId: interview.applicationId,
                    technicalScore: techScore,
                    interviewScore: commScore,
                    resumeScore: computedAiScore,
                    overallScore: compositeScore,
                    strengthsSummary: strengths || notes || 'Demonstrated solid technical logic and structured engineering approach.',
                    weaknessesSummary: improvements || 'Continue refining edge case handling and architectural performance optimizations.',
                    status: 'COMPLETED'
                }
            });
            // Create individual SkillAssessments for the 3 metrics
            const metricSkills = [
                { name: 'AI Technical Assessment', score: computedAiScore },
                { name: 'Technical Depth & Reasoning', score: techScore },
                { name: 'Communication & Articulation', score: commScore }
            ];
            for (const sk of metricSkills) {
                const level = sk.score >= 85 ? 'EXPERT' : sk.score >= 70 ? 'ADVANCED' : sk.score >= 50 ? 'INTERMEDIATE' : 'BEGINNER';
                await prisma_1.prisma.skillAssessment.create({
                    data: {
                        candidateId: interview.application.candidateId,
                        assessmentId: candidateAssessment.id,
                        skillName: sk.name,
                        score: sk.score,
                        level
                    }
                });
            }
            // Mark interview as COMPLETED
            await prisma_1.prisma.interview.update({
                where: { id: interviewId },
                data: { status: 'COMPLETED', actualEndTime: new Date() }
            });
            // Update candidate application status to ASSESSMENT_COMPLETED (awaiting Admin/Recruiter decision)
            // Interviewer does not decide hire/reject - Admin and Recruiter hold this authority
            await prisma_1.prisma.application.update({
                where: { id: interview.applicationId },
                data: { status: 'ASSESSMENT_COMPLETED' }
            });
            // Create AssessmentReport record with the 3 scores & interviewer feedback
            const report = await prisma_1.prisma.assessmentReport.create({
                data: {
                    interviewId: interview.id,
                    assessmentId: candidateAssessment.id,
                    recruiterRecommendation: 'PENDING_DECISION',
                    reportData: JSON.stringify({
                        candidateName: interview.application.candidate.user.name,
                        candidateEmail: interview.application.candidate.user.email,
                        jobTitle: interview.application.job.title,
                        companyName: interview.application.job.companyName,
                        interviewerName: req.user.name,
                        interviewDate: new Date().toLocaleDateString(),
                        aiScore: computedAiScore,
                        technicalScore: techScore,
                        communicationScore: commScore,
                        overallScore: compositeScore,
                        strengths: strengths || 'Demonstrated clear problem solving and technical logic.',
                        improvements: improvements || 'Can strengthen runtime complexity optimization.',
                        answers: uniqueAnswers.map(a => ({
                            questionTitle: a.question.title,
                            score: a.evaluation?.humanOverrideScore ?? a.evaluation?.finalScore ?? 0,
                            answerText: a.candidateAnswerText,
                            strengths: a.evaluation?.strengthsFeedback || 'Solid answer.',
                            improvements: a.evaluation?.improvementAreas || 'None noted.'
                        }))
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
                    interviewScore: techScore,
                    skillMatchScore: computedAiScore,
                    recruitmentStage: 'ASSESSMENT_COMPLETED',
                    rankExplanation: `Final evaluation score ${compositeScore}/100. Evaluator: ${req.user.name}. Technical: ${techScore}%, Communication: ${commScore}%, AI: ${computedAiScore}%.`,
                    updatedAt: new Date()
                },
                create: {
                    jobId: interview.application.jobId,
                    candidateId: interview.application.candidateId,
                    overallRank: 1,
                    compositeScore,
                    interviewScore: techScore,
                    skillMatchScore: computedAiScore,
                    recruitmentStage: 'ASSESSMENT_COMPLETED',
                    rankExplanation: `Final evaluation score ${compositeScore}/100. Evaluator: ${req.user.name}. Technical: ${techScore}%, Communication: ${commScore}%, AI: ${computedAiScore}%.`
                }
            });
            // Create Candidate Notification
            await prisma_1.prisma.notification.create({
                data: {
                    userId: interview.application.candidate.user.id,
                    title: 'Technical Assessment Concluded',
                    message: `Your technical evaluation for ${interview.application.job.title} has been finalized by evaluator ${req.user.name}. Stage: Assessment Completed (Awaiting Hiring Decision).`,
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
                    details: `Evaluator ${req.user.name} concluded interview. Score: ${compositeScore}/100 (AI: ${computedAiScore}%, Tech: ${techScore}%, Comm: ${commScore}%), Stage: ASSESSMENT_COMPLETED`
                }
            });
            res.json({
                success: true,
                message: 'Assessment finalized and report compiled.',
                assessment: candidateAssessment,
                report,
                applicationStatus: 'ASSESSMENT_COMPLETED'
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
