import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "AI Candidate Assessment & Interview Service"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "127.0.0.1")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    USE_FALLBACK_NLP: bool = os.getenv("USE_FALLBACK_NLP", "true").lower() == "true"
    DEFAULT_SIMILARITY_THRESHOLD: float = 0.65

settings = Settings()
