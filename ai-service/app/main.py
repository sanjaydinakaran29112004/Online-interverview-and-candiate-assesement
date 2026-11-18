from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import resume_routes, question_routes, evaluation_routes, ranking_routes, experiment_routes

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Microservice powering AI resume matching, question generation, answer evaluation, and candidate ranking."
)

# Enable CORS for communication with Backend and Direct Client Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(resume_routes.router, prefix="/api/ai")
app.include_router(question_routes.router, prefix="/api/ai")
app.include_router(evaluation_routes.router, prefix="/api/ai")
app.include_router(ranking_routes.router, prefix="/api/ai")
app.include_router(experiment_routes.router, prefix="/api/ai")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "endpoints": {
            "resume_parse": "/api/ai/resume/parse",
            "resume_match": "/api/ai/resume/match-job",
            "question_generate": "/api/ai/questions/generate",
            "answer_evaluate": "/api/ai/evaluation/evaluate-answer",
            "candidate_rank": "/api/ai/ranking/rank",
            "ieee_benchmark": "/api/ai/experiments/run-benchmark"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "nlp_engine": "Scikit-Learn TF-IDF Cosine + Multi-dimensional Rubrics",
        "fallback_mode": settings.USE_FALLBACK_NLP
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
