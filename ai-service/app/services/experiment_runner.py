import time
import math
from typing import List, Dict, Any
from app.models.schemas import IEEEExperimentRequest, IEEEExperimentResponse
from app.services.semantic_similarity import semantic_engine
from app.services.answer_evaluator import AnswerEvaluator, AnswerEvalRequest

class IEEEExperimentRunner:
    @staticmethod
    def calculate_spearman(x: List[float], y: List[float]) -> float:
        n = len(x)
        if n < 2:
            return 1.0

        def get_ranks(arr):
            sorted_pairs = sorted([(val, idx) for idx, val in enumerate(arr)])
            ranks = [0] * n
            for r, (val, idx) in enumerate(sorted_pairs):
                ranks[idx] = r + 1
            return ranks

        rx = get_ranks(x)
        ry = get_ranks(y)

        d_sq = sum((rx[i] - ry[i]) ** 2 for i in range(n))
        rho = 1.0 - (6.0 * d_sq / (n * (n ** 2 - 1)))
        return round(rho, 4)

    @classmethod
    def run_benchmark(cls, req: IEEEExperimentRequest) -> IEEEExperimentResponse:
        start_time = time.time()
        test_cases = req.test_cases
        n = len(test_cases)
        if n == 0:
            return IEEEExperimentResponse(
                sample_size=0,
                tfidf_cosine_mae=0.0,
                tfidf_cosine_rmse=0.0,
                hybrid_nlp_mae=0.0,
                hybrid_nlp_rmse=0.0,
                spearman_correlation=0.0,
                average_latency_ms=0.0,
                model_comparison_table=[]
            )

        ground_truths = []
        tfidf_predictions = []
        hybrid_predictions = []
        comparison_table = []

        for item in test_cases:
            gt = item.ground_truth_score
            ground_truths.append(gt)

            # Baseline 1: Pure TF-IDF Cosine
            raw_cosine = semantic_engine.calculate_cosine_similarity(item.candidate_answer, item.expected_answer)
            tfidf_score = round(raw_cosine * 100.0, 2)
            tfidf_predictions.append(tfidf_score)

            # Hybrid Rubric Evaluation
            eval_req = AnswerEvalRequest(
                question_title="Benchmark Question",
                question_description=item.question,
                skill_evaluated="Engineering Fundamentals",
                expected_concepts=[c.strip() for c in item.expected_answer.split(".") if len(c.strip()) > 3],
                candidate_answer=item.candidate_answer,
                evaluation_criteria="IEEE Benchmark Ground Truth Alignment"
            )
            eval_res = AnswerEvaluator.evaluate(eval_req)
            hybrid_score = eval_res.overall_score
            hybrid_predictions.append(hybrid_score)

            comparison_table.append({
                "question": item.question[:60] + "...",
                "candidate_answer": item.candidate_answer[:60] + "...",
                "human_ground_truth": gt,
                "tfidf_cosine_score": tfidf_score,
                "hybrid_nlp_score": hybrid_score,
                "tfidf_error": abs(tfidf_score - gt),
                "hybrid_error": abs(hybrid_score - gt)
            })

        # Calculate MAE & RMSE
        tfidf_mae = sum(abs(p - g) for p, g in zip(tfidf_predictions, ground_truths)) / n
        tfidf_rmse = math.sqrt(sum((p - g) ** 2 for p, g in zip(tfidf_predictions, ground_truths)) / n)

        hybrid_mae = sum(abs(p - g) for p, g in zip(hybrid_predictions, ground_truths)) / n
        hybrid_rmse = math.sqrt(sum((p - g) ** 2 for p, g in zip(hybrid_predictions, ground_truths)) / n)

        spearman = cls.calculate_spearman(hybrid_predictions, ground_truths)
        elapsed_ms = (time.time() - start_time) * 1000.0 / n

        return IEEEExperimentResponse(
            sample_size=n,
            tfidf_cosine_mae=round(tfidf_mae, 2),
            tfidf_cosine_rmse=round(tfidf_rmse, 2),
            hybrid_nlp_mae=round(hybrid_mae, 2),
            hybrid_nlp_rmse=round(hybrid_rmse, 2),
            spearman_correlation=spearman,
            average_latency_ms=round(elapsed_ms, 2),
            model_comparison_table=comparison_table
        )
