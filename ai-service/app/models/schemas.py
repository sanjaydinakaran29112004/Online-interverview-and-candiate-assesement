from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Resume Models ---
class ResumeParseRequest(BaseModel):
    file_path: Optional[str] = None
    raw_text: Optional[str] = None

class SkillExtractionResult(BaseModel):
    all_skills: List[str]
    languages: List[str] = []
    frameworks: List[str] = []
    databases: List[str] = []
    devops_cloud: List[str] = []
    tools: List[str] = []

class ResumeParseResponse(BaseModel):
    success: bool
    extracted_text: str
    skills: SkillExtractionResult
    education: List[str] = []
    experience_years: float = 0.0
    certifications: List[str] = []
    contact_info: Dict[str, Optional[str]] = {}

class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str
    required_skills: List[str]
    candidate_skills: Optional[List[str]] = None

class JobMatchResponse(BaseModel):
    compatibility_score: float = Field(..., ge=0.0, le=100.0)
    matched_skills: List[str]
    missing_skills: List[str]
    skill_coverage_pct: float
    semantic_similarity_pct: float
    explanation: str

# --- Question Generation Models ---
class QuestionGenRequest(BaseModel):
    job_title: str
    job_description: str
    required_skills: List[str]
    experience_level: str = "intermediate"  # beginner, intermediate, advanced, expert
    category: str = "technical"             # technical, programming, hr, behavioral, situational, domain
    num_questions: int = 5
    duration_minutes: int = 30

class GeneratedQuestion(BaseModel):
    title: str
    description: str
    category: str
    difficulty: str
    skill_evaluated: str
    expected_concepts: List[str]
    evaluation_criteria: str
    max_score: float = 100.0
    time_limit_seconds: int = 180

class QuestionGenResponse(BaseModel):
    success: bool
    job_title: str
    category: str
    questions: List[GeneratedQuestion]

# --- Answer Evaluation Models ---
class AnswerEvalRequest(BaseModel):
    question_title: str
    question_description: str
    skill_evaluated: str
    expected_concepts: List[str]
    candidate_answer: str
    evaluation_criteria: Optional[str] = None
    max_score: float = 100.0

class MetricBreakdown(BaseModel):
    technical_correctness: float  # Weight: 30%
    semantic_relevance: float     # Weight: 25%
    conceptual_understanding: float # Weight: 20%
    completeness: float           # Weight: 15%
    keyword_coverage: float       # Weight: 10%

class AnswerEvalResponse(BaseModel):
    success: bool
    overall_score: float = Field(..., ge=0.0, le=100.0)
    metrics: MetricBreakdown
    matched_concepts: List[str]
    missing_concepts: List[str]
    strengths: str
    improvement_areas: str
    explainable_feedback: str
    evaluation_model: str

# --- Candidate Ranking Models ---
class CandidateRankingItemInput(BaseModel):
    candidate_id: str
    candidate_name: str
    resume_score: float
    technical_score: float
    interview_score: float
    years_experience: float
    matched_skills_count: int
    total_required_skills: int

class CandidateRankingItemOutput(BaseModel):
    rank: int
    candidate_id: str
    candidate_name: str
    composite_score: float
    resume_score: float
    technical_score: float
    interview_score: float
    rank_explanation: str

class CandidateRankRequest(BaseModel):
    job_id: str
    job_title: str
    candidates: List[CandidateRankingItemInput]

class CandidateRankResponse(BaseModel):
    job_id: str
    ranked_candidates: List[CandidateRankingItemOutput]

# --- IEEE Experiment Models ---
class IEEEBenchmarkItem(BaseModel):
    question: str
    expected_answer: str
    candidate_answer: str
    ground_truth_score: float  # Expert human rating (0-100)

class IEEEExperimentRequest(BaseModel):
    test_cases: List[IEEEBenchmarkItem]

class IEEEExperimentResponse(BaseModel):
    sample_size: int
    tfidf_cosine_mae: float
    tfidf_cosine_rmse: float
    hybrid_nlp_mae: float
    hybrid_nlp_rmse: float
    spearman_correlation: float
    average_latency_ms: float
    model_comparison_table: List[Dict[str, Any]]
