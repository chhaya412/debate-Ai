import logging
import time
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from .config import settings
from .models.schemas import (
    EvaluateRequest,
    EvaluateResponse,
    GenerateQuestionRequest,
    GenerateQuestionResponse,
    GenerateFeedbackRequest,
    GenerateFeedbackResponse,
)
from .services.scoring_pipeline import ScoringPipeline
from .services.question_service import QuestionFeedbackService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_debate_judge")

app = FastAPI(
    title="AI Debate Arena - Chief Adjudicator AI Judge Service",
    description="Hybrid AI Evaluation Microservice combining Semantic Sentence Transformers, Linguistic Rules, and LLM Qualitative Adjudication.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Timing & Telemetry Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time-Seconds"] = f"{process_time:.4f}"
        return response
    except Exception as exc:
        process_time = time.time() - start_time
        logger.error(f"Request failed in {process_time:.4f}s: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "Internal AI Evaluation Engine Failure",
                "details": str(exc),
            }
        )

# Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation Error",
            "details": exc.errors(),
        }
    )

# Generic Exception Handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "An unexpected error occurred during AI evaluation",
            "message": str(exc)
        }
    )

# --- Endpoints ---

@app.get("/health", tags=["System"])
async def health_check() -> Dict[str, Any]:
    """Health check endpoint for container probes and orchestration."""
    return {
        "status": "healthy",
        "service": "AI Debate Judge Service",
        "version": "1.0.0",
        "provider": settings.LLM_PROVIDER,
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
    }

@app.post("/evaluate", response_model=EvaluateResponse, tags=["Evaluation"])
async def evaluate_argument(request: EvaluateRequest) -> EvaluateResponse:
    """
    Evaluates a debater's argument against the topic and opponent's case.
    Uses a hybrid pipeline:
    - Semantic Similarity (Sentence Transformers / TF-IDF vectors)
    - Rule-based logic, evidence, and fallacy checks
    - LLM qualitative judging and Socratic interrogation
    """
    try:
        logger.info(f"Evaluating argument for topic: '{request.debate_topic[:40]}...' (Round {request.round_number})")
        result = ScoringPipeline.evaluate(request)
        return result
    except Exception as e:
        logger.error(f"Error during argument evaluation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation pipeline error: {str(e)}"
        )

@app.post("/generate-question", response_model=GenerateQuestionResponse, tags=["Cross-Examination"])
async def generate_question(request: GenerateQuestionRequest) -> GenerateQuestionResponse:
    """
    Generates a targeted cross-examination question targeting the weakest premise in the argument.
    """
    try:
        logger.info(f"Generating cross-examination question for topic '{request.debate_topic[:40]}...'")
        result = QuestionFeedbackService.generate_question(request)
        return result
    except Exception as e:
        logger.error(f"Error generating question: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Question generation error: {str(e)}"
        )

@app.post("/generate-feedback", response_model=GenerateFeedbackResponse, tags=["Coaching"])
async def generate_feedback(request: GenerateFeedbackRequest) -> GenerateFeedbackResponse:
    """
    Provides deep debate coaching feedback and actionable training drills.
    """
    try:
        logger.info(f"Generating coaching feedback for topic '{request.debate_topic[:40]}...'")
        result = QuestionFeedbackService.generate_feedback(request)
        return result
    except Exception as e:
        logger.error(f"Error generating feedback: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feedback generation error: {str(e)}"
        )

@app.post("/internal/ai/evaluate-argument", tags=["Internal"])
async def evaluate_argument_internal(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Adapter endpoint for Node.js Express backend match turn evaluation.
    """
    try:
        prior_args = []
        for p in payload.get("priorRounds", []):
            prior_args.append({
                "roundNumber": 1,
                "speakerSide": p.get("speakerSide", "affirmative"),
                "argumentText": p.get("text", "")
            })

        eval_req = EvaluateRequest(
            debateId=payload.get("debateId", "match_1"),
            debateTopic=payload.get("topicMotion", "Debate Motion"),
            playerArgument=payload.get("argumentText", ""),
            roundNumber=payload.get("roundNumber", 1),
            previousArguments=prior_args
        )

        res = ScoringPipeline.evaluate(eval_req)
        cats = res.categories

        # Map 0-100 categories to Node.js backend 0-20/0-15 subscale
        logic_scaled = round((cats.logic / 100) * 20)
        relevance_scaled = round((cats.relevance / 100) * 15)
        evidence_scaled = round((cats.evidence / 100) * 15)
        rebuttal_scaled = round((cats.rebuttal / 100) * 20)
        persuasiveness_scaled = round((cats.persuasiveness / 100) * 15)
        rule_adherence_scaled = round((cats.clarity / 100) * 15)

        mapped_fallacies = []
        total_deduction = 0
        for idx, f in enumerate(res.fallacies):
            deduct = 6 if f.confidence > 0.8 else 3
            total_deduction -= deduct
            mapped_fallacies.append({
                "id": f"fal_{idx}_{int(time.time())}",
                "name": f.type.replace("_", " ").title(),
                "quote": f.quote or "Identified in dialectical structure",
                "explanation": f.explanation,
                "severity": "critical" if f.confidence > 0.8 else "minor",
                "deduction": deduct
            })

        total = max(0, logic_scaled + relevance_scaled + evidence_scaled + rebuttal_scaled + persuasiveness_scaled + rule_adherence_scaled + total_deduction)

        return {
            "logic": logic_scaled,
            "relevance": relevance_scaled,
            "evidence": evidence_scaled,
            "rebuttal": rebuttal_scaled,
            "persuasiveness": persuasiveness_scaled,
            "ruleAdherence": rule_adherence_scaled,
            "fallacyDeductions": total_deduction,
            "total": total,
            "fallacies": mapped_fallacies,
            "aiFeedbackSummary": res.feedback,
            "aiCrossQuestion": res.crossExaminationQuestion or "How do you defend the underlying assumption?"
        }
    except Exception as e:
        logger.error(f"Internal evaluation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
