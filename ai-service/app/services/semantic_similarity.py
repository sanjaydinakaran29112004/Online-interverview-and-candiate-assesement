import math
from typing import List, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.utils.preprocessing import clean_text, tokenize

class SemanticSimilarityEngine:
    def __init__(self):
        # Configure robust TF-IDF with sublinear tf scaling and unigram + bigram support
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words='english',
            min_df=1
        )

    def calculate_cosine_similarity(self, text_a: str, text_b: str) -> float:
        """Calculate TF-IDF Cosine Similarity between two text passages (0.0 to 1.0)."""
        clean_a = clean_text(text_a)
        clean_b = clean_text(text_b)

        if not clean_a or not clean_b:
            return 0.0

        try:
            tfidf_matrix = self.vectorizer.fit_transform([clean_a, clean_b])
            sim_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            score = float(sim_matrix[0][0])
            return max(0.0, min(1.0, score))
        except Exception:
            return self.calculate_jaccard_similarity(clean_a, clean_b)

    def calculate_jaccard_similarity(self, text_a: str, text_b: str) -> float:
        """Calculate token-level Jaccard similarity as an additional robust signal."""
        tokens_a = set(tokenize(text_a))
        tokens_b = set(tokenize(text_b))

        if not tokens_a or not tokens_b:
            return 0.0

        intersection = len(tokens_a & tokens_b)
        union = len(tokens_a | tokens_b)

        return float(intersection / union) if union > 0 else 0.0

    def compute_concept_coverage(self, candidate_text: str, expected_concepts: List[str]) -> Tuple[List[str], List[str], float]:
        """Verify which expected domain concepts or keywords are covered by candidate answer."""
        candidate_lower = candidate_text.lower()
        matched = []
        missing = []

        for concept in expected_concepts:
            clean_c = clean_text(concept)
            # Check 1: Direct phrase presence
            if clean_c in candidate_lower:
                matched.append(concept)
                continue

            # Check 2: Semantic similarity between concept and candidate text
            c_tokens = [t for t in tokenize(clean_c) if len(t) > 2]
            if not c_tokens:
                matched.append(concept)
                continue

            # Check overlap of meaningful tokens
            overlap_count = sum(1 for t in c_tokens if t in candidate_lower)
            overlap_ratio = overlap_count / len(c_tokens)

            # Cosine similarity between this concept and candidate text
            concept_cos = self.calculate_cosine_similarity(clean_c, candidate_text)

            if overlap_ratio >= 0.5 or concept_cos >= 0.25:
                matched.append(concept)
            else:
                missing.append(concept)

        coverage_ratio = len(matched) / len(expected_concepts) if expected_concepts else 1.0
        return matched, missing, coverage_ratio

semantic_engine = SemanticSimilarityEngine()
