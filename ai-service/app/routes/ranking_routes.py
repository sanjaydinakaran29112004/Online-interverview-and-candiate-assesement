from fastapi import APIRouter, HTTPException
from app.models.schemas import CandidateRankRequest, CandidateRankResponse
from app.services.candidate_ranker import CandidateRanker

router = APIRouter(prefix="/ranking", tags=["Candidate Ranking"])

@router.post("/rank", response_model=CandidateRankResponse)
def rank_candidates(req: CandidateRankRequest):
    try:
        return CandidateRanker.rank_candidates(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to rank candidates: {str(e)}")
