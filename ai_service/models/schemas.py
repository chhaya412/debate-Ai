from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PreviousArgument(BaseModel):
    round_number: int = Field(default=1, alias="roundNumber")
    speaker_side: str = Field(default="affirmative", alias="speakerSide")
    speaker_name: Optional[str] = Field(default="Debater", alias="speakerName")
    argument_text: str = Field(..., alias="argumentText")

    class Config:
        populate_by_name = True

class EvaluateRequest(BaseModel):
    debate_id: Optional[str] = Field(default="debate_default", alias="debateId")
    debate_topic: str = Field(..., alias="debateTopic", description="Motion or debate topic")
    player_argument: str = Field(..., alias="playerArgument", min_length=10, description="Debater's active argument")
    opponent_argument: Optional[str] = Field(default=None, alias="opponentArgument", description="Direct opponent counter-argument to rebut")
    previous_arguments: List[PreviousArgument] = Field(default_factory=list, alias="previousArguments")
    round_number: int = Field(default=1, alias="roundNumber", ge=1)
    debate_context: Optional[str] = Field(default="", alias="debateContext")

    class Config:
        populate_by_name = True

class FallacyItem(BaseModel):
    type: str = Field(..., description="E.g. strawman, ad_hominem, false_dilemma, slippery_slope")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence 0-1")
    explanation: str = Field(..., description="Why this constitutes a fallacy")
    quote: Optional[str] = Field(default=None, description="Direct excerpt containing fallacy")

class CategoryScores(BaseModel):
    logic: int = Field(..., ge=0, le=100, description="Valid syllogistic reasoning and premises")
    relevance: int = Field(..., ge=0, le=100, description="Adherence to the core motion")
    evidence: int = Field(..., ge=0, le=100, description="Empirical data, citations, and warrants")
    rebuttal: int = Field(..., ge=0, le=100, description="Direct deconstruction of opponent claims")
    persuasiveness: int = Field(..., ge=0, le=100, description="Rhetorical appeal and impact")
    consistency: int = Field(..., ge=0, le=100, description="Non-contradiction with prior turns")
    clarity: int = Field(..., ge=0, le=100, description="Precision of syntax and vocabulary")

class EvaluateResponse(BaseModel):
    playerScore: int = Field(..., ge=0, le=100)
    categories: CategoryScores
    fallacies: List[FallacyItem] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    feedback: str = Field(...)
    winnerProbability: float = Field(..., ge=0.0, le=1.0)
    crossExaminationQuestion: Optional[str] = None
    telemetry: Optional[Dict[str, Any]] = None

class GenerateQuestionRequest(BaseModel):
    debate_topic: str = Field(..., alias="debateTopic")
    player_argument: str = Field(..., alias="playerArgument")
    opponent_argument: Optional[str] = Field(default=None, alias="opponentArgument")
    round_number: int = Field(default=1, alias="roundNumber")

    class Config:
        populate_by_name = True

class GenerateQuestionResponse(BaseModel):
    crossExaminationQuestion: str
    targetClaim: str
    vulnerabilityIdentified: str

class GenerateFeedbackRequest(BaseModel):
    debate_topic: str = Field(..., alias="debateTopic")
    player_argument: str = Field(..., alias="playerArgument")
    categories: Optional[Dict[str, int]] = None
    fallacies: Optional[List[Dict[str, Any]]] = None

    class Config:
        populate_by_name = True

class GenerateFeedbackResponse(BaseModel):
    executiveSummary: str
    keyStrengths: List[str]
    criticalWeaknesses: List[str]
    coachingDrills: List[str]
