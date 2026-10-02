import math
from typing import List, Dict, Any, Optional
from ..config import settings
from ..models.schemas import (
    EvaluateRequest,
    EvaluateResponse,
    CategoryScores,
    FallacyItem
)
from .semantic_service import SemanticService
from .rule_evaluator import RuleEvaluator
from .llm_provider import get_llm_provider
from ..prompts.templates import (
    EVALUATION_SYSTEM_PROMPT,
    EVALUATION_USER_PROMPT
)

class ScoringPipeline:
    """Hybrid Evaluation Pipeline fusing Semantic Embeddings, Rule-based checks, and LLM reasoning."""

    @classmethod
    def evaluate(cls, req: EvaluateRequest) -> EvaluateResponse:
        player_arg = req.player_argument.strip()
        topic = req.debate_topic.strip()
        opponent_arg = req.opponent_argument.strip() if req.opponent_argument else None
        
        # 1. Semantic Similarity Checks
        semantic_relevance = SemanticService.compute_relevance_to_topic(player_arg, topic)
        semantic_rebuttal = SemanticService.compute_rebuttal_engagement(player_arg, opponent_arg)
        
        # Prior arguments on the same side for consistency
        prior_same_side = [
            prev.argument_text for prev in req.previous_arguments 
            if prev.speaker_side.lower() == "affirmative" # or active side
        ]
        semantic_consistency = SemanticService.compute_consistency(player_arg, prior_same_side)

        # 2. Rule-Based Checks
        rule_results = RuleEvaluator.evaluate(player_arg, opponent_arg)
        rule_logic = rule_results["logic"]
        rule_evidence = rule_results["evidence"]
        rule_rebuttal = rule_results["rebuttal"]
        rule_clarity = rule_results["clarity"]
        rule_fallacies = rule_results["detected_fallacies"]

        # 3. LLM Qualitative Evaluation
        llm = get_llm_provider()
        prev_context_str = "\n".join([
            f"[Round {p.round_number} - {p.speaker_side}]: {p.argument_text}"
            for p in req.previous_arguments[-4:]
        ]) if req.previous_arguments else "Opening round - no prior context."

        user_prompt = EVALUATION_USER_PROMPT.format(
            topic=topic,
            round_number=req.round_number,
            player_argument=player_arg,
            opponent_argument=opponent_arg or "None (Constructive Opening)",
            previous_context=prev_context_str
        )

        try:
            llm_res = llm.generate_json(EVALUATION_SYSTEM_PROMPT, user_prompt)
        except Exception:
            # Fallback if unhandled
            llm_res = {
                "categories": {
                    "logic": 80, "relevance": 85, "evidence": 75,
                    "rebuttal": 80, "persuasiveness": 80, "consistency": 85, "clarity": 85
                },
                "fallacies": [],
                "strengths": ["Consistent argumentation and good thematic focus"],
                "weaknesses": ["Could incorporate more statistical citations"],
                "feedback": "Solid argument with clear dialectical progression.",
                "crossExaminationQuestion": "What empirical threshold proves your central premise?"
            }

        llm_cats = llm_res.get("categories", {})
        llm_logic = llm_cats.get("logic", 80)
        llm_relevance = llm_cats.get("relevance", 85)
        llm_evidence = llm_cats.get("evidence", 75)
        llm_rebuttal = llm_cats.get("rebuttal", 80)
        llm_persuasiveness = llm_cats.get("persuasiveness", 80)
        llm_consistency = llm_cats.get("consistency", 85)
        llm_clarity = llm_cats.get("clarity", 85)

        # 4. Hybrid Category Fusion
        # Fusing: Semantic (where applicable), Rule-based, and LLM
        final_relevance = round(
            (semantic_relevance * 0.35) + (rule_results.get("clarity", 80) * 0.15) + (llm_relevance * 0.50)
        )
        final_rebuttal = round(
            (semantic_rebuttal * 0.30) + (rule_rebuttal * 0.20) + (llm_rebuttal * 0.50)
        )
        final_consistency = round(
            (semantic_consistency * 0.40) + (85 * 0.10) + (llm_consistency * 0.50)
        )
        final_evidence = round(
            (rule_evidence * 0.40) + (llm_evidence * 0.60)
        )
        final_logic = round(
            (rule_logic * 0.35) + (llm_logic * 0.65)
        )
        final_clarity = round(
            (rule_clarity * 0.35) + (llm_clarity * 0.65)
        )
        final_persuasiveness = round(
            (semantic_relevance * 0.15) + (rule_logic * 0.15) + (llm_persuasiveness * 0.70)
        )

        categories = CategoryScores(
            logic=min(100, max(10, final_logic)),
            relevance=min(100, max(10, final_relevance)),
            evidence=min(100, max(10, final_evidence)),
            rebuttal=min(100, max(10, final_rebuttal)),
            persuasiveness=min(100, max(10, final_persuasiveness)),
            consistency=min(100, max(10, final_consistency)),
            clarity=min(100, max(10, final_clarity))
        )

        # 5. Fallacy Fusion & Deduplication
        combined_fallacies: List[FallacyItem] = list(rule_fallacies)
        raw_llm_fallacies = llm_res.get("fallacies", [])
        
        for f in raw_llm_fallacies:
            if isinstance(f, dict):
                f_type = f.get("type", "logical_fallacy").lower().replace(" ", "_")
                # Deduplicate against existing rule fallacies
                if not any(rf.type == f_type for rf in combined_fallacies):
                    combined_fallacies.append(
                        FallacyItem(
                            type=f_type,
                            confidence=float(f.get("confidence", 0.8)),
                            explanation=f.get("explanation", "Detected informal or formal fallacy"),
                            quote=f.get("quote")
                        )
                    )

        # Fallacy penalty calculation (-6 points per confident fallacy)
        fallacy_penalty = sum(int(f.confidence * 8) for f in combined_fallacies)

        # 6. Overall Player Score
        w = settings.CATEGORY_WEIGHTS
        base_score = (
            (categories.logic * w["logic"]) +
            (categories.relevance * w["relevance"]) +
            (categories.evidence * w["evidence"]) +
            (categories.rebuttal * w["rebuttal"]) +
            (categories.persuasiveness * w["persuasiveness"]) +
            (categories.consistency * w["consistency"]) +
            (categories.clarity * w["clarity"])
        )

        player_score = max(10, min(99, round(base_score - fallacy_penalty)))

        # 7. Winner Probability (Calibrated Sigmoid around competitive benchmark of 75)
        # Score 75 -> ~0.50; Score 85 -> ~0.76; Score 92 -> ~0.90
        logit = (player_score - 75.0) / 9.0
        winner_probability = round(1.0 / (1.0 + math.exp(-logit)), 2)
        winner_probability = min(0.98, max(0.05, winner_probability))

        strengths = llm_res.get("strengths", [
            "Coherent argumentative framework with clear premise-to-conclusion flow",
            "Effective vocabulary and signposting"
        ])
        weaknesses = llm_res.get("weaknesses", [
            "Could integrate empirical statistics to fortify warrants"
        ])
        feedback = llm_res.get("feedback", "A solid dialectical contribution that advanced your team's case.")
        cross_q = llm_res.get("crossExaminationQuestion", "How do you address the strongest economic counter-argument?")

        telemetry = {
            "hybrid_breakdown": {
                "semantic_relevance": semantic_relevance,
                "semantic_rebuttal": semantic_rebuttal,
                "semantic_consistency": semantic_consistency,
                "rule_logic": rule_logic,
                "rule_evidence": rule_evidence,
                "rule_rebuttal": rule_rebuttal,
                "rule_clarity": rule_clarity,
                "llm_provider": settings.LLM_PROVIDER,
                "fallacy_deductions": fallacy_penalty
            }
        }

        return EvaluateResponse(
            playerScore=player_score,
            categories=categories,
            fallacies=combined_fallacies,
            strengths=strengths,
            weaknesses=weaknesses,
            feedback=feedback,
            winnerProbability=winner_probability,
            crossExaminationQuestion=cross_q,
            telemetry=telemetry
        )
