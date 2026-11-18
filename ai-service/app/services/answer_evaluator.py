import re
from typing import List, Dict, Any, Tuple
from app.models.schemas import AnswerEvalRequest, AnswerEvalResponse, MetricBreakdown
from app.services.semantic_similarity import semantic_engine
from app.utils.preprocessing import clean_text, tokenize

class AnswerEvaluator:
    # Strict Rubric Weights defined by specifications
    WEIGHT_TECHNICAL_CORRECTNESS = 0.30     # 30%
    WEIGHT_SEMANTIC_RELEVANCE = 0.25        # 25%
    WEIGHT_CONCEPTUAL_UNDERSTANDING = 0.20 # 20%
    WEIGHT_COMPLETENESS = 0.15              # 15%
    WEIGHT_KEYWORD_COVERAGE = 0.10          # 10%

    @classmethod
    def evaluate(cls, req: AnswerEvalRequest) -> AnswerEvalResponse:
        answer = req.candidate_answer.strip()
        expected_concepts = req.expected_concepts or []
        expected_text = " ".join(expected_concepts) + " " + (req.evaluation_criteria or "")

        # Step 4: Preprocess candidate text
        cleaned_answer = clean_text(answer)
        tokens = tokenize(cleaned_answer)
        word_count = len(tokens)

        # Baseline check: Empty or trivial input
        if word_count < 3:
            return AnswerEvalResponse(
                success=True,
                overall_score=0.0,
                metrics=MetricBreakdown(
                    technical_correctness=0.0,
                    semantic_relevance=0.0,
                    conceptual_understanding=0.0,
                    completeness=0.0,
                    keyword_coverage=0.0
                ),
                matched_concepts=[],
                missing_concepts=expected_concepts,
                strengths="None provided.",
                improvement_areas="Please provide a substantive answer explaining the core technical concepts.",
                explainable_feedback="Answer was too brief or contained no relevant technical explanation.",
                evaluation_model="ScikitLearn-NLP-Rubric-v1"
            )

        # Step 7: Concept and keyword coverage
        matched_concepts, missing_concepts, concept_ratio = semantic_engine.compute_concept_coverage(
            cleaned_answer, expected_concepts
        )
        keyword_coverage = round(concept_ratio * 100.0, 2)

        # Step 5 & 6: Semantic similarity & Cosine score
        cosine_sim = semantic_engine.calculate_cosine_similarity(cleaned_answer, expected_text)
        # Combine cosine similarity with concept semantic overlap
        semantic_relevance = round(min(100.0, max(cosine_sim * 170.0, concept_ratio * 100.0)), 2)

        # Step 8: Conceptual Understanding
        # Measures depth of explanation: presence of relational reasoning terms (because, therefore, causes, ensures, prevents, tradeoffs)
        reasoning_markers = ["because", "therefore", "since", "whereas", "however", "ensures", "prevents", "tradeoff", "architecture", "mechanism", "internal"]
        reasoning_score = min(1.0, sum(1 for m in reasoning_markers if m in cleaned_answer.lower()) / 2.0)
        conceptual_understanding = round(min(100.0, (concept_ratio * 0.7 + reasoning_score * 0.3) * 100.0), 2)

        # Step 9: Completeness of answer based on conceptual breadth and elaboration
        length_factor = min(1.0, word_count / 40.0)  # full points for elaborate answers around 40+ relevant words
        completeness = round((concept_ratio * 0.65 + length_factor * 0.35) * 100.0, 2)

        # Step 10: Technical Correctness
        # Check against common misconceptions or contradictions
        incorrect_patterns = [
            (r"sql.*not.*support.*acid", "SQL databases do support ACID transactions by default."),
            (r"react.*state.*immutable.*props.*mutable", "In React, state is internally managed while props are strictly read-only."),
            (r"single.*thread.*means.*node.*cannot.*io", "Node.js offloads asynchronous I/O to libuv worker pool."),
            (r"http.*is.*stateful", "HTTP is fundamentally a stateless protocol.")
        ]
        penalty = 0.0
        detected_flaws = []
        for pat, flaw in incorrect_patterns:
            if re.search(pat, cleaned_answer):
                penalty += 25.0
                detected_flaws.append(flaw)

        base_technical = (semantic_relevance * 0.4 + keyword_coverage * 0.6)
        technical_correctness = max(0.0, min(100.0, round(base_technical - penalty, 2)))

        # Final Weighted Aggregation
        overall_score = round(
            technical_correctness * cls.WEIGHT_TECHNICAL_CORRECTNESS +
            semantic_relevance * cls.WEIGHT_SEMANTIC_RELEVANCE +
            conceptual_understanding * cls.WEIGHT_CONCEPTUAL_UNDERSTANDING +
            completeness * cls.WEIGHT_COMPLETENESS +
            keyword_coverage * cls.WEIGHT_KEYWORD_COVERAGE,
            2
        )

        # Generate Explainable Feedback
        strengths_list = []
        if matched_concepts:
            strengths_list.append(f"Correctly identified key concepts: {', '.join(matched_concepts[:3])}.")
        if semantic_relevance > 70:
            strengths_list.append("Maintained high semantic alignment with the question's core objective.")
        if word_count >= 30:
            strengths_list.append("Provided a well-structured and detailed explanation.")
        strengths = " ".join(strengths_list) if strengths_list else "Basic attempt recorded."

        improvements_list = []
        if missing_concepts:
            improvements_list.append(f"Consider elaborating on missing concepts such as: {', '.join(missing_concepts[:3])}.")
        if detected_flaws:
            improvements_list.extend(detected_flaws)
        if completeness < 65:
            improvements_list.append("Provide more concrete architectural details, practical examples, or tradeoffs.")
        improvement_areas = " ".join(improvements_list) if improvements_list else "Answer was comprehensive and met technical evaluation standards."

        feedback = (
            f"Candidate achieved an overall score of {overall_score}/100. "
            f"The answer demonstrated {conceptual_understanding}% conceptual understanding and covered {len(matched_concepts)}/{len(expected_concepts)} primary criteria. "
            f"{improvement_areas}"
        )

        return AnswerEvalResponse(
            success=True,
            overall_score=overall_score,
            metrics=MetricBreakdown(
                technical_correctness=technical_correctness,
                semantic_relevance=semantic_relevance,
                conceptual_understanding=conceptual_understanding,
                completeness=completeness,
                keyword_coverage=keyword_coverage
            ),
            matched_concepts=matched_concepts,
            missing_concepts=missing_concepts,
            strengths=strengths,
            improvement_areas=improvement_areas,
            explainable_feedback=feedback,
            evaluation_model="ScikitLearn-TFIDF-SemanticRubric-v1"
        )
