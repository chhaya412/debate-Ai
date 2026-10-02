import math
import re
from typing import List, Optional
import numpy as np
from ..config import settings

class SemanticService:
    """Computes semantic similarity for debate relevance, rebuttal engagement, and consistency."""

    _model = None
    _model_loaded = False

    @classmethod
    def get_model(cls):
        if not cls._model_loaded:
            try:
                from sentence_transformers import SentenceTransformer
                cls._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
                cls._model_loaded = True
            except Exception as e:
                # Log graceful fallback if torch/sentence_transformers not loaded or downloading
                cls._model = None
                cls._model_loaded = True
        return cls._model

    @classmethod
    def compute_similarity(cls, text_a: str, text_b: str) -> float:
        """Returns semantic cosine similarity between 0.0 and 1.0."""
        if not text_a or not text_b:
            return 0.5

        model = cls.get_model()
        if model is not None:
            try:
                embeddings = model.encode([text_a, text_b])
                emb_a = embeddings[0]
                emb_b = embeddings[1]
                dot = np.dot(emb_a, emb_b)
                norm_a = np.linalg.norm(emb_a)
                norm_b = np.linalg.norm(emb_b)
                if norm_a == 0 or norm_b == 0:
                    return 0.5
                sim = float(dot / (norm_a * norm_b))
                # Normalize cosine range [-1, 1] to [0, 1]
                return max(0.0, min(1.0, (sim + 1.0) / 2.0))
            except Exception:
                pass

        # Resilient Vectorized TF-IDF Cosine Similarity Fallback
        return cls._fallback_similarity(text_a, text_b)

    @classmethod
    def compute_relevance_to_topic(cls, argument: str, topic: str) -> float:
        """Returns semantic similarity between argument and topic (0-100 scale)."""
        sim = cls.compute_similarity(argument, topic)
        # Calibrated scaling: 0.25-0.50 similarity reflects targeted thematic debate coverage
        calibrated = 35.0 + (sim * 70.0)
        return round(min(100.0, max(20.0, calibrated)), 1)

    @classmethod
    def compute_rebuttal_engagement(cls, player_arg: str, opponent_arg: Optional[str]) -> float:
        """Evaluates semantic overlap with opponent's assertions (0-100 scale)."""
        if not opponent_arg:
            return 80.0  # Opening turns have no prior opponent assertion to rebut

        sim = cls.compute_similarity(player_arg, opponent_arg)
        # Moderate to high similarity indicates direct dialectical engagement
        score = min(100.0, max(30.0, sim * 110))
        return round(score, 1)

    @classmethod
    def compute_consistency(cls, player_arg: str, prior_same_side_args: List[str]) -> float:
        """Checks consistency against prior arguments made by the same team/side."""
        if not prior_same_side_args:
            return 90.0  # First round default high consistency

        similarities = [cls.compute_similarity(player_arg, prior) for prior in prior_same_side_args]
        avg_sim = sum(similarities) / len(similarities)

        # In debates, subsequent rounds should remain in the same thematic domain (0.3-0.8)
        # Extremes: < 0.15 = complete abandonment of stance; > 0.95 = repetitive circularity
        if avg_sim < 0.2:
            return 55.0
        elif avg_sim > 0.9:
            return 75.0  # Repetitive penalty
        else:
            return round(80.0 + (avg_sim * 20.0), 1)

    @classmethod
    def _fallback_similarity(cls, text_a: str, text_b: str) -> float:
        """Term-Frequency word-vector cosine similarity."""
        def tokenize(text: str) -> List[str]:
            return [w for w in re.findall(r'\b\w{3,}\b', text.lower())]

        words_a = tokenize(text_a)
        words_b = tokenize(text_b)

        if not words_a or not words_b:
            return 0.5

        vocab = set(words_a).union(set(words_b))
        freq_a = {w: words_a.count(w) for w in vocab}
        freq_b = {w: words_b.count(w) for w in vocab}

        dot_product = sum(freq_a[w] * freq_b[w] for w in vocab)
        norm_a = math.sqrt(sum(v * v for v in freq_a.values()))
        norm_b = math.sqrt(sum(v * v for v in freq_b.values()))

        if norm_a == 0 or norm_b == 0:
            return 0.5

        raw_sim = dot_product / (norm_a * norm_b)
        return min(1.0, max(0.1, raw_sim * 1.5))
