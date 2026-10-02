import re
from typing import Dict, List, Tuple
from ..models.schemas import FallacyItem

class RuleEvaluator:
    """Rule-based linguistic, structural, and fallacy analysis for debate arguments."""

    EVIDENCE_PATTERNS = [
        r'\b\d+(?:\.\d+)?%',                      # Percentages
        r'\$\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:billion|million|trillion|k))?',  # Currency
        r'\b(?:19|20)\d{2}\b',                     # Years
        r'\b(?:study|research|meta-analysis|dataset|report|survey|statistics|census)\b',
        r'\b(?:according to|published in|journal of|demonstrated by|findings show|empirical data)\b',
        r'\b(?:harvard|oxford|stanford|mit|who|un|geneva|supreme court|peer-reviewed)\b'
    ]

    LOGIC_CONNECTORS = [
        r'\b(?:therefore|consequently|thus|hence|ergo|as a result|it follows that)\b',
        r'\b(?:because|since|given that|owing to|due to the premise)\b',
        r'\b(?:if\b.*?\bthen\b)',
        r'\b(?:warrant|syllogism|deduction|causal mechanism|direct corollary)\b'
    ]

    REBUTTAL_MARKERS = [
        r'\b(?:however|conversely|in contrast|nevertheless|on the contrary)\b',
        r'\b(?:the opposition claims|my opponent asserted|their contention|they argue that)\b',
        r'\b(?:this collapses|this assertion fails|flawed premise|mischaracterizes|unfounded)\b',
        r'\b(?:even if we grant|even conceding their point|their counter-example fails)\b'
    ]

    FALLACY_RULES = [
        (
            "ad_hominem",
            [
                r'\b(?:you are|my opponent is|the opposition is)\s+(?:an?\s+)?(?:stupid|idiot|idiotic|naive|corrupt|evil|ignorant|dishonest|liar|hypocrite|fool|clueless)\b',
                r'\b(?:insane|crazy|moronic|clueless|brainwashed)\b'
            ],
            "Attacks the character, motive, or intelligence of the opponent rather than refuting their argument."
        ),
        (
            "slippery_slope",
            [
                r'\b(?:will inevitably lead to|inevitably cause|snowball into|slippery slope|lead directly to the end of|destroy all human civilization|total collapse)\b'
            ],
            "Asserts that a relatively small first step will inevitably trigger a catastrophic chain of events without establishing causal proof."
        ),
        (
            "false_dilemma",
            [
                r'\b(?:either we|it is either)\b.*?\b(?:or else|or total|or we will all)\b',
                r'\b(?:there are only two options|the only alternative is ruin|with us or against us)\b'
            ],
            "Presents complex issues as a forced binary choice while excluding viable intermediate alternatives."
        ),
        (
            "strawman",
            [
                r'\b(?:so you\'re saying we should just|my opponent wants everyone to suffer|the opposition wants to destroy|they believe that nothing matters)\b'
            ],
            "Misrepresents or caricatures the opponent's argument to make it easier to attack."
        ),
        (
            "circular_reasoning",
            [
                r'\b(?:is right because it is correct|is true because it\'s the truth|valid because it cannot be wrong)\b'
            ],
            "The conclusion is assumed directly in the premise without independent justification."
        )
    ]

    @classmethod
    def evaluate(cls, argument: str, opponent_argument: str = None) -> Dict[str, any]:
        words = argument.split()
        word_count = len(words)
        sentences = [s.strip() for s in re.split(r'[.!?]+', argument) if len(s.strip()) > 3]
        sentence_count = max(1, len(sentences))
        avg_sentence_len = word_count / sentence_count

        # 1. Evidence Score (0-100)
        evidence_matches = 0
        for pat in cls.EVIDENCE_PATTERNS:
            matches = re.findall(pat, argument, re.IGNORECASE)
            evidence_matches += len(matches)
        
        evidence_score = min(100, 45 + (evidence_matches * 12))

        # 2. Logic Structure Score (0-100)
        logic_matches = 0
        for pat in cls.LOGIC_CONNECTORS:
            matches = re.findall(pat, argument, re.IGNORECASE)
            logic_matches += len(matches)
        
        logic_score = min(100, 52 + (logic_matches * 12))

        # 3. Rebuttal Markers Score (0-100)
        rebuttal_matches = 0
        for pat in cls.REBUTTAL_MARKERS:
            matches = re.findall(pat, argument, re.IGNORECASE)
            rebuttal_matches += len(matches)
        
        if opponent_argument:
            rebuttal_score = min(100, 48 + (rebuttal_matches * 14))
        else:
            rebuttal_score = 80  # Opening constructives do not require rebuttals

        # 4. Clarity & Coherence (0-100)
        # Optimal sentence length in competitive debate is 15-28 words
        if 12 <= avg_sentence_len <= 30:
            length_bonus = 20
        elif avg_sentence_len < 8 or avg_sentence_len > 45:
            length_bonus = 0
        else:
            length_bonus = 10

        # Word count penalty for brevity
        if word_count < 30:
            volume_score = 40
        elif word_count < 70:
            volume_score = 65
        else:
            volume_score = 80

        clarity_score = min(100, volume_score + length_bonus)

        # 5. Fallacy Detection
        detected_fallacies: List[FallacyItem] = []
        for fallacy_type, patterns, explanation in cls.FALLACY_RULES:
            for pat in patterns:
                match = re.search(pat, argument, re.IGNORECASE)
                if match:
                    detected_fallacies.append(
                        FallacyItem(
                            type=fallacy_type,
                            confidence=0.85,
                            explanation=explanation,
                            quote=match.group(0)
                        )
                    )
                    break

        return {
            "evidence": evidence_score,
            "logic": logic_score,
            "rebuttal": rebuttal_score,
            "clarity": clarity_score,
            "detected_fallacies": detected_fallacies,
            "word_count": word_count,
            "sentence_count": sentence_count,
        }
