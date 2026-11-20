export type Role = 'ADMIN' | 'RECRUITER' | 'INTERVIEWER' | 'CANDIDATE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatarUrl?: string;
  candidateProfile?: CandidateProfile;
  recruiterProfile?: RecruiterProfile;
  interviewerProfile?: InterviewerProfile;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  phone?: string;
  headline?: string;
  summary?: string;
  education?: string;
  experienceYears: number;
  location?: string;
  technicalSkills?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export interface RecruiterProfile {
  id: string;
  userId: string;
  companyName: string;
  department?: string;
  designation?: string;
  phone?: string;
}

export interface InterviewerProfile {
  id: string;
  userId: string;
  technicalDomain?: string;
  yearsOfExperience: number;
  bio?: string;
}

export interface JobSkill {
  id?: string;
  skillName: string;
  weight: number;
  isRequired: boolean;
  minimumProficiency: string;
}

export interface Job {
  id: string;
  title: string;
  companyName: string;
  description: string;
  department?: string;
  location: string;
  employmentType: string;
  minExperience: number;
  maxExperience: number;
  educationalReq?: string;
  salaryRange?: string;
  openingsCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  createdAt: string;
  skills: JobSkill[];
  _count?: { applications: number };
}

export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'IN_PROGRESS'
  | 'ASSESSMENT_COMPLETED'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'UNDER_REVIEW'
  | 'REJECTED'
  | 'COMPLETED';

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  appliedAt: string;
  job: Job;
  candidate: CandidateProfile & { user: { name: string; email: string } };
  resumeAnalyses?: ResumeAnalysis[];
  interviews?: Interview[];
  assessments?: any[];
}

export interface ResumeAnalysis {
  id: string;
  extractedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  experienceSummary?: string;
  compatibilityScore: number;
  scoreExplanation?: string;
  analyzedAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  title: string;
  interviewType: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  roomCode: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  meetingNotes?: string;
  application?: Application;
  participants?: { user: { id: string; name: string; role: string; email?: string } }[];
  answers?: InterviewAnswer[];
  assessmentReport?: any;
}

export interface InterviewQuestion {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  skillEvaluated: string;
  expectedConcepts: string | string[];
  evaluationCriteria?: string;
  maxScore: number;
  timeLimitSeconds: number;
  isAiGenerated?: boolean;
}

export interface InterviewAnswer {
  id: string;
  interviewId: string;
  questionId: string;
  candidateAnswerText: string;
  submittedAt: string;
  evaluation?: AnswerEvaluation;
  question: InterviewQuestion;
}

export interface AnswerEvaluation {
  id: string;
  technicalCorrectness: number;
  semanticRelevance: number;
  conceptualUnderstanding: number;
  completeness: number;
  keywordCoverage: number;
  finalScore: number;
  strengthsFeedback?: string;
  missingConcepts?: string;
  improvementAreas?: string;
  humanOverrideScore?: number;
  overrideReason?: string;
  modelUsed: string;
}

export interface CandidateAssessment {
  id: string;
  technicalScore: number;
  interviewScore: number;
  resumeScore: number;
  overallScore: number;
  strengthsSummary?: string;
  weaknessesSummary?: string;
  status: string;
  assessedAt: string;
  skillAssessments?: { id: string; skillName: string; score: number }[];
  report?: { id: string; recruiterRecommendation: string };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
