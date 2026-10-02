"""Comprehensive test suite for AI Judge FastAPI service."""
import unittest
from ai_service.models.schemas import (
    EvaluateRequest,
    GenerateQuestionRequest,
    GenerateFeedbackRequest,
    PreviousArgument
)
from ai_service.services.semantic_service import SemanticService
from ai_service.services.rule_evaluator import RuleEvaluator
from ai_service.services.scoring_pipeline import ScoringPipeline
from ai_service.services.question_service import QuestionFeedbackService

class TestAIJudgeService(unittest.TestCase):

    def setUp(self):
        self.topic = "This House would ban fully autonomous lethal weapon systems (LAWS)."
        self.sample_arg = (
            "Delegating lethal targeting to algorithmic neural networks creates a catastrophic accountability gap. "
            "According to a 2024 Harvard Law study, over 68% of automated sensor models exhibited target classification drift. "
            "Therefore, without direct human-in-the-loop verification, autonomous systems violate international humanitarian law. "
            "While the opposition claims autonomous systems reduce civilian casualties, empirical combat data demonstrates "
            "that sensor degradation in contested environments leads to uncorrectable collateral damage."
        )
        self.opponent_arg = (
            "Autonomous weapon systems compute tactical trajectories with precision that far exceeds human reaction times, "
            "reducing human emotional panic in high-stress combat."
        )

    def test_semantic_similarity(self):
        sim = SemanticService.compute_similarity(
            "Autonomous weapons ban",
            "Banning autonomous lethal weapons"
        )
        self.assertGreater(sim, 0.4)

        rel = SemanticService.compute_relevance_to_topic(self.sample_arg, self.topic)
        self.assertGreaterEqual(rel, 50.0)

    def test_rule_evaluator_evidence_and_logic(self):
        eval_res = RuleEvaluator.evaluate(self.sample_arg, self.opponent_arg)
        # Should detect 2024, 68%, Harvard, therefore, while the opposition claims
        self.assertGreater(eval_res["evidence"], 60)
        self.assertGreater(eval_res["logic"], 60)
        self.assertGreater(eval_res["rebuttal"], 60)

    def test_rule_evaluator_fallacy_detection(self):
        fallacy_arg = "My opponent is an idiot who knows nothing, and this will inevitably lead to the total collapse of civilization!"
        eval_res = RuleEvaluator.evaluate(fallacy_arg)
        fallacies = eval_res["detected_fallacies"]
        types = [f.type for f in fallacies]
        self.assertIn("ad_hominem", types)
        self.assertIn("slippery_slope", types)

    def test_scoring_pipeline_hybrid_evaluation(self):
        req = EvaluateRequest(
            debate_topic=self.topic,
            player_argument=self.sample_arg,
            opponent_argument=self.opponent_arg,
            previous_arguments=[
                PreviousArgument(
                    round_number=1,
                    speaker_side="affirmative",
                    speaker_name="Alpha",
                    argument_text="We establish that human accountability is legally non-delegable."
                )
            ],
            round_number=2
        )
        res = ScoringPipeline.evaluate(req)

        # Check required fields
        self.assertIsInstance(res.playerScore, int)
        self.assertGreaterEqual(res.playerScore, 0)
        self.assertLessEqual(res.playerScore, 100)

        # Check all 7 categories
        self.assertGreater(res.categories.logic, 0)
        self.assertGreater(res.categories.relevance, 0)
        self.assertGreater(res.categories.evidence, 0)
        self.assertGreater(res.categories.rebuttal, 0)
        self.assertGreater(res.categories.persuasiveness, 0)
        self.assertGreater(res.categories.consistency, 0)
        self.assertGreater(res.categories.clarity, 0)

        # Check probability
        self.assertGreaterEqual(res.winnerProbability, 0.0)
        self.assertLessEqual(res.winnerProbability, 1.0)

        # Check feedback and lists
        self.assertTrue(len(res.strengths) > 0)
        self.assertTrue(len(res.feedback) > 0)

    def test_question_service(self):
        req = GenerateQuestionRequest(
            debate_topic=self.topic,
            player_argument=self.sample_arg,
            round_number=2
        )
        res = QuestionFeedbackService.generate_question(req)
        self.assertTrue(len(res.crossExaminationQuestion) > 10)

    def test_feedback_service(self):
        req = GenerateFeedbackRequest(
            debate_topic=self.topic,
            player_argument=self.sample_arg,
            categories={"logic": 85, "evidence": 80}
        )
        res = QuestionFeedbackService.generate_feedback(req)
        self.assertTrue(len(res.executiveSummary) > 5)
        self.assertTrue(len(res.coachingDrills) > 0)

if __name__ == "__main__":
    unittest.main()
