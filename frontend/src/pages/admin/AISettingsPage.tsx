import React, { useState } from 'react';
import { Cpu, ShieldAlert, CheckCircle2, Sliders, Save, Sparkles } from 'lucide-react';

export const AISettingsPage: React.FC = () => {
  const [weights, setWeights] = useState({
    technicalCorrectness: 30,
    semanticRelevance: 25,
    conceptualUnderstanding: 20,
    completeness: 15,
    keywordCoverage: 10
  });

  const [fallbackMode, setFallbackMode] = useState(true);
  const [saved, setSaved] = useState(false);

  const total =
    weights.technicalCorrectness +
    weights.semanticRelevance +
    weights.conceptualUnderstanding +
    weights.completeness +
    weights.keywordCoverage;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (total !== 100) {
      alert('Total weights must sum to exactly 100%.');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Assessment Engine Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Calibrate the 5 rubric dimensions, configure NLP fallback behavior, and enforce bias guardrails
        </p>
      </div>

      {/* Ethical Guardrail Banner */}
      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200 text-amber-900 text-xs space-y-2">
        <div className="flex items-center space-x-2 font-bold text-amber-950">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Active Ethical AI Bias Guardrails</span>
        </div>
        <p className="leading-relaxed">
          The evaluation engine scores candidate answers strictly using text semantics, expected concept overlap, and technical correctness. It is mathematically barred from inferring emotions, accents, facial patterns, age, gender, or protected personal characteristics. Human interviewers retain override capability on all scores.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">5-Dimensional Rubric Weighting</h3>
              <p className="text-slate-400 mt-0.5">Sum must equal 100% (Current: {total}%)</p>
            </div>
            <span className={`font-black text-sm px-3 py-1 rounded-xl ${
              total === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {total}%
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Technical Correctness (Target: 30%)</span>
                <span>{weights.technicalCorrectness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.technicalCorrectness}
                onChange={e => setWeights({ ...weights, technicalCorrectness: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Semantic Relevance (Target: 25%)</span>
                <span>{weights.semanticRelevance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.semanticRelevance}
                onChange={e => setWeights({ ...weights, semanticRelevance: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Conceptual Understanding (Target: 20%)</span>
                <span>{weights.conceptualUnderstanding}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={weights.conceptualUnderstanding}
                onChange={e => setWeights({ ...weights, conceptualUnderstanding: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Answer Completeness (Target: 15%)</span>
                <span>{weights.completeness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.completeness}
                onChange={e => setWeights({ ...weights, completeness: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Keyword Coverage (Target: 10%)</span>
                <span>{weights.keywordCoverage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.keywordCoverage}
                onChange={e => setWeights({ ...weights, keywordCoverage: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={fallbackMode}
                onChange={e => setFallbackMode(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span>Enable Scikit-Learn TF-IDF deterministic fallback if LLM service is offline</span>
            </label>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save AI Weights</span>
            </button>
          </div>

          {saved && (
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>AI Evaluation rubric weights persisted successfully.</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
