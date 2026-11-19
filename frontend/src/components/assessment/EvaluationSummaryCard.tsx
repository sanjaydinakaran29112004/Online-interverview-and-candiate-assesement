import React from 'react';
import { Award, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';
import { AnswerEvaluation } from '../../types';
import { getScoreColor } from '../../utils/helpers';

interface EvaluationSummaryCardProps {
  evaluation: AnswerEvaluation;
  isInterviewer?: boolean;
  onOverrideScore?: () => void;
}

export const EvaluationSummaryCard: React.FC<EvaluationSummaryCardProps> = ({
  evaluation,
  isInterviewer = false,
  onOverrideScore
}) => {
  const scoreColors = getScoreColor(evaluation.finalScore);

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-5 text-white shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">AI Rubric Evaluation Summary</h3>
            <span className="text-xs text-slate-400">
              Evaluated via NLP Semantic Vector Analysis
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-black text-indigo-400">
            {evaluation.finalScore}%
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Composite Score
          </span>
        </div>
      </div>

      {/* 5 Rubric Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Technical Correctness', val: evaluation.technicalCorrectness },
          { label: 'Semantic Relevance', val: evaluation.semanticRelevance },
          { label: 'Conceptual Depth', val: evaluation.conceptualUnderstanding },
          { label: 'Completeness', val: evaluation.completeness },
          { label: 'Keyword Coverage', val: evaluation.keywordCoverage }
        ].map((m, i) => (
          <div key={i} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-xs font-semibold text-slate-400 truncate">{m.label}</div>
            <div className="text-lg font-black text-indigo-300 mt-1">{m.val}%</div>
          </div>
        ))}
      </div>

      {/* Strengths & Improvement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/60 space-y-1.5">
          <div className="font-bold text-emerald-400 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
            <span>Key Strengths Identified</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {evaluation.strengthsFeedback || 'Candidate demonstrated logical structure and domain competence.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-900/60 space-y-1.5">
          <div className="font-bold text-amber-400 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
            <span>Areas for Development</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {evaluation.improvementAreas || 'Deepen concrete examples on scalability and concurrency trade-offs.'}
          </p>
        </div>
      </div>

      {/* Evaluator Notes / Override */}
      {evaluation.overrideReason && (
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
          <div className="font-bold text-slate-400 uppercase text-[10px]">Human Evaluator Notes:</div>
          <p className="text-slate-300 italic">{evaluation.overrideReason}</p>
        </div>
      )}

      {/* Interviewer Override Trigger */}
      {isInterviewer && onOverrideScore && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={onOverrideScore}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Manual Score Calibration</span>
          </button>
        </div>
      )}
    </div>
  );
};
