from fastapi import APIRouter, HTTPException
from app.models.schemas import AnswerEvalRequest, AnswerEvalResponse
from app.services.answer_evaluator import AnswerEvaluator

router = APIRouter(prefix="/evaluation", tags=["Answer Evaluation"])

@router.post("/evaluate-answer", response_model=AnswerEvalResponse)
def evaluate_answer(req: AnswerEvalRequest):
    try:
        return AnswerEvaluator.evaluate(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")
