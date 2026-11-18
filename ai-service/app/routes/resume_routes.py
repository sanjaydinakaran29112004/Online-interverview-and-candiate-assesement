from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List
import tempfile
import os
from app.models.schemas import ResumeParseRequest, ResumeParseResponse, JobMatchRequest, JobMatchResponse
from app.services.resume_parser import ResumeParser
from app.services.skill_extractor import SkillExtractor
from app.services.semantic_similarity import semantic_engine

router = APIRouter(prefix="/resume", tags=["Resume Analysis"])

@router.post("/parse", response_model=ResumeParseResponse)
def parse_resume(req: ResumeParseRequest):
    try:
        return ResumeParser.parse_resume(file_path=req.file_path, raw_text=req.raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@router.post("/upload-and-parse", response_model=ResumeParseResponse)
async def upload_and_parse(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = ResumeParser.parse_resume(file_path=tmp_path)
        return result
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@router.post("/match-job", response_model=JobMatchResponse)
def match_job(req: JobMatchRequest):
    try:
        cand_skills = req.candidate_skills
        if cand_skills is None or len(cand_skills) == 0:
            extracted = SkillExtractor.extract_skills(req.resume_text)
            cand_skills = extracted.all_skills

        comparison = SkillExtractor.compare_skills(cand_skills, req.required_skills)
        matched = comparison["matched_skills"]
        missing = comparison["missing_skills"]
        coverage_pct = comparison["coverage_pct"]

        # Calculate semantic cosine similarity between full resume and job description
        cosine_sim = semantic_engine.calculate_cosine_similarity(req.resume_text, req.job_description)
        semantic_pct = round(cosine_sim * 100.0, 2)

        # Composite compatibility score (60% skill match, 40% semantic fit)
        compatibility_score = round((coverage_pct * 0.60) + (semantic_pct * 0.40), 2)

        explanation = (
            f"Compatibility rating is {compatibility_score}%. "
            f"Candidate matches {len(matched)} of {len(req.required_skills)} required technical skills ({coverage_pct}% coverage). "
            f"Resume content demonstrates {semantic_pct}% contextual similarity with the role requisition. "
            f"{'Missing critical skills: ' + ', '.join(missing) if missing else 'All required competencies identified.'}"
        )

        return JobMatchResponse(
            compatibility_score=compatibility_score,
            matched_skills=matched,
            missing_skills=missing,
            skill_coverage_pct=coverage_pct,
            semantic_similarity_pct=semantic_pct,
            explanation=explanation
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating job match: {str(e)}")
