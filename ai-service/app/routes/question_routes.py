from fastapi import APIRouter, HTTPException
from app.models.schemas import QuestionGenRequest, QuestionGenResponse
from app.services.question_generator import QuestionGenerator

router = APIRouter(prefix="/questions", tags=["Question Generation"])

@router.post("/generate", response_model=QuestionGenResponse)
def generate_questions(req: QuestionGenRequest):
    try:
        questions = QuestionGenerator.generate_questions(req)
        return QuestionGenResponse(
            success=True,
            job_title=req.job_title,
            category=req.category,
            questions=questions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")
