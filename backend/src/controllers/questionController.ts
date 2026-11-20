import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { AIService } from '../services/aiService';

export class QuestionController {
  static async generateQuestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        jobTitle,
        jobDescription,
        requiredSkills,
        experienceLevel = 'intermediate',
        category = 'technical',
        numQuestions = 5,
        saveAsSet = false,
        jobId
      } = req.body;

      if (!jobTitle || !requiredSkills) {
        res.status(400).json({ success: false, message: 'jobTitle and requiredSkills are required.' });
        return;
      }

      const generated = await AIService.generateQuestions(
        jobTitle,
        jobDescription || 'Standard software engineering evaluation.',
        Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills],
        experienceLevel,
        category,
        parseInt(numQuestions, 10)
      );

      let savedSet = null;
      if (saveAsSet) {
        savedSet = await prisma.questionSet.create({
          data: {
            title: `${jobTitle} - ${category.toUpperCase()} Question Set`,
            description: `Generated AI Question Bank for ${jobTitle} (${experienceLevel})`,
            category: category.toUpperCase(),
            targetRole: jobTitle,
            jobId: jobId || null,
            questions: {
              create: generated.map((q: any) => ({
                title: q.title,
                description: q.description,
                category: q.category,
                difficulty: q.difficulty,
                skillEvaluated: q.skill_evaluated,
                expectedConcepts: JSON.stringify(q.expected_concepts),
                evaluationCriteria: q.evaluation_criteria,
                maxScore: q.max_score || 100,
                timeLimitSeconds: q.time_limit_seconds || 180,
                isAiGenerated: true
              }))
            }
          },
          include: { questions: true }
        });
      }

      res.json({
        success: true,
        questions: generated,
        savedQuestionSet: savedSet
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async listQuestionSets(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { jobId, category } = req.query;
      const whereClause: any = {};
      if (jobId) whereClause.jobId = String(jobId);
      if (category) whereClause.category = String(category);

      const sets = await prisma.questionSet.findMany({
        where: whereClause,
        include: { questions: true, job: true },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, questionSets: sets });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async listAllQuestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const questions = await prisma.interviewQuestion.findMany({
        orderBy: [{ category: 'asc' }, { difficulty: 'asc' }, { title: 'asc' }]
      });
      res.json({ success: true, questions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createCustomQuestion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        title,
        description,
        category = 'TECHNICAL',
        difficulty = 'INTERMEDIATE',
        skillEvaluated,
        expectedConcepts,
        evaluationCriteria,
        maxScore = 100,
        timeLimitSeconds = 180,
        questionSetId
      } = req.body;

      const question = await prisma.interviewQuestion.create({
        data: {
          title,
          description,
          category,
          difficulty,
          skillEvaluated: skillEvaluated || 'General',
          expectedConcepts: typeof expectedConcepts === 'string' ? expectedConcepts : JSON.stringify(expectedConcepts),
          evaluationCriteria,
          maxScore: parseFloat(maxScore),
          timeLimitSeconds: parseInt(timeLimitSeconds, 10),
          isAiGenerated: false,
          questionSetId: questionSetId || null
        }
      });

      res.status(201).json({ success: true, question });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
