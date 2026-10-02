import os
from typing import Dict
from dotenv import load_dotenv

load_dotenv()

class Settings:
    HOST: str = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "8001"))
    ENV: str = os.getenv("ENV", "development")

    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")  # "gemini" | "mock" | "openai"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "gemini-2.0-flash")

    # Embedding model for semantic similarity
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")

    # Hybrid weights: Semantic (20%), Rule-based (30%), LLM (50%)
    WEIGHT_SEMANTIC: float = 0.20
    WEIGHT_RULE: float = 0.30
    WEIGHT_LLM: float = 0.50

    # Category Weights for Overall Score Calculation
    CATEGORY_WEIGHTS: Dict[str, float] = {
        "logic": 0.20,
        "relevance": 0.15,
        "evidence": 0.15,
        "rebuttal": 0.20,
        "persuasiveness": 0.10,
        "consistency": 0.10,
        "clarity": 0.10,
    }

settings = Settings()
