from typing import List
from app.models.schemas import (
    CandidateRankRequest,
    CandidateRankResponse,
    CandidateRankingItemInput,
    CandidateRankingItemOutput
)

class CandidateRanker:
    # Multi-Criteria Decision Weightings
    WEIGHT_TECHNICAL_TEST = 0.35    # 35%
    WEIGHT_INTERVIEW = 0.30         # 30%
    WEIGHT_RESUME_FIT = 0.20        # 20%
    WEIGHT_EXPERIENCE = 0.15        # 15%

    @classmethod
    def rank_candidates(cls, req: CandidateRankRequest) -> CandidateRankResponse:
        candidates = req.candidates
        if not candidates:
            return CandidateRankResponse(job_id=req.job_id, ranked_candidates=[])

        scored_items = []
        for c in candidates:
            # Normalize experience score (e.g. 5+ years = 100%)
            exp_score = min(100.0, (c.years_experience / 5.0) * 100.0)

            # Skill coverage multiplier
            skill_ratio = (c.matched_skills_count / c.total_required_skills) if c.total_required_skills > 0 else 1.0
            adjusted_resume_score = (c.resume_score * 0.7) + (skill_ratio * 100.0 * 0.3)

            composite = round(
                (c.technical_score * cls.WEIGHT_TECHNICAL_TEST) +
                (c.interview_score * cls.WEIGHT_INTERVIEW) +
                (adjusted_resume_score * cls.WEIGHT_RESUME_FIT) +
                (exp_score * cls.WEIGHT_EXPERIENCE),
                2
            )

            explanation = (
                f"Candidate achieved a composite score of {composite}/100. "
                f"Strongest performance: {'Technical Assessment' if c.technical_score >= c.interview_score else 'Live Interview'} "
                f"({max(c.technical_score, c.interview_score):.1f}%). "
                f"Covered {c.matched_skills_count}/{c.total_required_skills} required skills with {c.years_experience} yrs experience."
            )

            scored_items.append({
                "candidate_id": c.candidate_id,
                "candidate_name": c.candidate_name,
                "composite_score": composite,
                "resume_score": round(adjusted_resume_score, 2),
                "technical_score": c.technical_score,
                "interview_score": c.interview_score,
                "rank_explanation": explanation
            })

        # Sort descending by composite_score
        scored_items.sort(key=lambda x: x["composite_score"], reverse=True)

        ranked_results = []
        for i, item in enumerate(scored_items):
            ranked_results.append(CandidateRankingItemOutput(
                rank=i + 1,
                candidate_id=item["candidate_id"],
                candidate_name=item["candidate_name"],
                composite_score=item["composite_score"],
                resume_score=item["resume_score"],
                technical_score=item["technical_score"],
                interview_score=item["interview_score"],
                rank_explanation=item["rank_explanation"]
            ))

        return CandidateRankResponse(
            job_id=req.job_id,
            ranked_candidates=ranked_results
        )
