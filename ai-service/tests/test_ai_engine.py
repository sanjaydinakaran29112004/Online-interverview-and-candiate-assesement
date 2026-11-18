import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.skill_extractor import SkillExtractor
from app.services.resume_parser import ResumeParser
from app.services.semantic_similarity import semantic_engine
from app.services.question_generator import QuestionGenerator
from app.services.candidate_ranker import CandidateRanker
from app.services.answer_evaluator import AnswerEvaluator
from app.models.schemas import (
    QuestionGenRequest,
    AnswerEvalRequest,
    CandidateRankRequest,
    CandidateRankingItemInput,
    IEEEExperimentRequest,
    IEEEBenchmarkItem
)
from app.services.experiment_runner import IEEEExperimentRunner

def test_all():
    print("=== TEST 1: Skill Extraction ===")
    sample_resume = """
    Jane Doe - Senior Full Stack Engineer
    Email: jane.doe@example.com | Phone: (555) 123-4567 | github.com/janedoe
    Summary: 5+ years of experience building modern cloud applications with React, Node.js, TypeScript, and PostgreSQL.
    Proficient with Docker, Kubernetes, AWS, and Git.
    Education: B.Tech in Computer Science.
    Certifications: AWS Certified Solutions Architect.
    """
    parse_res = ResumeParser.parse_resume(raw_text=sample_resume)
    print(f"Extracted Skills: {parse_res.skills.all_skills}")
    print(f"Years of Experience: {parse_res.experience_years}")
    print(f"Education: {parse_res.education}")
    assert "react" in parse_res.skills.all_skills
    assert "node.js" in parse_res.skills.all_skills

    print("\n=== TEST 2: Job Matching ===")
    req_skills = ["react", "node.js", "postgresql", "docker", "graphql"]
    comp = SkillExtractor.compare_skills(parse_res.skills.all_skills, req_skills)
    print(f"Matched Skills: {comp['matched_skills']}")
    print(f"Missing Skills: {comp['missing_skills']}")
    print(f"Skill Coverage: {comp['coverage_pct']}%")

    print("\n=== TEST 3: Question Generation ===")
    gen_req = QuestionGenRequest(
        job_title="Full Stack Software Engineer",
        job_description="Building high performance web platforms.",
        required_skills=["React", "Node.js", "SQL"],
        experience_level="intermediate",
        category="technical",
        num_questions=3
    )
    questions = QuestionGenerator.generate_questions(gen_req)
    print(f"Generated {len(questions)} questions:")
    for q in questions:
        print(f"- [{q.category}] {q.title} (Skill: {q.skill_evaluated})")
    assert len(questions) == 3

    print("\n=== TEST 4: Answer Evaluation (5-Metric Scoring) ===")
    eval_req = AnswerEvalRequest(
        question_title="React Hooks and Performance Optimization",
        question_description="How do useMemo, useCallback, and React.memo prevent unnecessary renders?",
        skill_evaluated="React",
        expected_concepts=["useMemo caches computed values", "useCallback memoizes function references", "React.memo skips render on unchanged props", "Memory and equality check overhead"],
        candidate_answer="useMemo caches expensive computed values between renders. useCallback memoizes function instances so child components do not re-render unnecessarily when wrapped in React.memo. However, overusing them introduces memory overhead and equality check costs.",
        evaluation_criteria="Measures practical experience with React render cycles."
    )
    eval_res = AnswerEvaluator.evaluate(eval_req)
    print(f"Overall Score: {eval_res.overall_score}/100")
    print(f"Metrics breakdown: {eval_res.metrics}")
    print(f"Strengths: {eval_res.strengths}")
    print(f"Improvement areas: {eval_res.improvement_areas}")
    assert eval_res.overall_score >= 65

    print("\n=== TEST 5: Candidate Ranking ===")
    rank_req = CandidateRankRequest(
        job_id="job-101",
        job_title="Full Stack Developer",
        candidates=[
            CandidateRankingItemInput(
                candidate_id="c1",
                candidate_name="Alice Smith",
                resume_score=88,
                technical_score=92,
                interview_score=85,
                years_experience=4.5,
                matched_skills_count=5,
                total_required_skills=5
            ),
            CandidateRankingItemInput(
                candidate_id="c2",
                candidate_name="Bob Jones",
                resume_score=70,
                technical_score=65,
                interview_score=72,
                years_experience=2.0,
                matched_skills_count=3,
                total_required_skills=5
            )
        ]
    )
    rank_res = CandidateRanker.rank_candidates(rank_req)
    print(f"Rank 1: {rank_res.ranked_candidates[0].candidate_name} with score {rank_res.ranked_candidates[0].composite_score}")
    assert rank_res.ranked_candidates[0].candidate_id == "c1"

    print("\n=== TEST 6: IEEE Experiment Benchmark ===")
    exp_req = IEEEExperimentRequest(
        test_cases=[
            IEEEBenchmarkItem(
                question="What is the difference between SQL and NoSQL?",
                expected_answer="SQL uses structured relational tables and ACID transactions. NoSQL provides flexible schema and horizontal scalability.",
                candidate_answer="SQL databases use structured schema and tables with ACID guarantees, whereas NoSQL allows unstructured document models and horizontal scaling.",
                ground_truth_score=90.0
            ),
            IEEEBenchmarkItem(
                question="What is Node.js event loop?",
                expected_answer="Single threaded event loop offloading asynchronous I/O to libuv thread pool.",
                candidate_answer="It is single threaded and manages callbacks asynchronously through libuv.",
                ground_truth_score=85.0
            )
        ]
    )
    exp_res = IEEEExperimentRunner.run_benchmark(exp_req)
    print(f"IEEE MAE: {exp_res.hybrid_nlp_mae}, RMSE: {exp_res.hybrid_nlp_rmse}, Spearman: {exp_res.spearman_correlation}, Latency: {exp_res.average_latency_ms}ms")
    print("\nALL AI TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all()
