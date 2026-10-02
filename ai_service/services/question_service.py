import json
from typing import Dict, Any, List
from ..models.schemas import (
    GenerateQuestionRequest,
    GenerateQuestionResponse,
    GenerateFeedbackRequest,
    GenerateFeedbackResponse,
)
from .llm_provider import get_llm_provider
from ..prompts.templates import (
    CROSS_EXAMINATION_PROMPT,
    COACHING_FEEDBACK_PROMPT,
)

class QuestionFeedbackService:
    """Generates incisive Socratic questions and structured coaching drills."""

    @classmethod
    def generate_question(cls, req: GenerateQuestionRequest) -> GenerateQuestionResponse:
        llm = get_llm_provider()
        prompt = CROSS_EXAMINATION_PROMPT.format(
            topic=req.debate_topic,
            argument=req.player_argument
        )
        try:
            res = llm.generate_json("You are an expert debate cross-examiner.", prompt)
            return GenerateQuestionResponse(
                crossExaminationQuestion=res.get("crossExaminationQuestion", "How does this argument withstand empirical scrutiny under boundary conditions?"),
                targetClaim=res.get("targetClaim", "The primary assertion made in the argument"),
                vulnerabilityIdentified=res.get("vulnerabilityIdentified", "Potential unstated presupposition or burden of proof shift")
            )
        except Exception:
            return GenerateQuestionResponse(
                crossExaminationQuestion=f"Regarding '{req.debate_topic}', what empirical threshold validates your central claim against counter-evidence?",
                targetClaim="Primary premise",
                vulnerabilityIdentified="Empirical warrant insufficiency"
            )

    @classmethod
    def generate_feedback(cls, req: GenerateFeedbackRequest) -> GenerateFeedbackResponse:
        llm = get_llm_provider()
        metrics_str = json.dumps(req.categories or {"logic": 82, "evidence": 75, "rebuttal": 80})
        prompt = COACHING_FEEDBACK_PROMPT.format(
            topic=req.debate_topic,
            argument=req.player_argument,
            metrics=metrics_str
        )
        try:
            res = llm.generate_json("You are a champion collegiate debate coach.", prompt)
            return GenerateFeedbackResponse(
                executiveSummary=res.get("executiveSummary", "Constructive argument with solid logical scaffolding."),
                keyStrengths=res.get("keyStrengths", ["Clear thematic line", "Effective syntactic signposting"]),
                criticalWeaknesses=res.get("criticalWeaknesses", ["Empirical citation density could be increased"]),
                coachingDrills=res.get("coachingDrills", ["Practice the 'Assertion-Reason-Evidence' (ARE) drill in 60-second intervals."])
            )
        except Exception:
            return GenerateFeedbackResponse(
                executiveSummary="The argument is articulate and coherent, but warrants deeper empirical grounding.",
                keyStrengths=["Strong topical focus", "Well-paced delivery"],
                criticalWeaknesses=["Lack of external statistical warrants"],
                coachingDrills=["Cross-Examination Resilience: Prepare 2 counter-examples for your main thesis."]
            )
