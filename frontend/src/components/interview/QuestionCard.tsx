import React from 'react';
import { HelpCircle, Send, Sparkles, Edit3, Mic } from 'lucide-react';
import { InterviewQuestion } from '../../types';

interface QuestionCardProps {
  question?: InterviewQuestion;
  currentIndex: number;
  totalQuestions: number;
  isInterviewer: boolean;
  answerText: string;
  isEvaluating: boolean;
  onAnswerChange: (text: string) => void;
  onPushQuestion?: () => void;
  onSubmitAnswer: () => void;
  onSampleAnswer?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  isInterviewer,
  answerText,
  isEvaluating,
  onAnswerChange,
  onPushQuestion,
  onSubmitAnswer,
  onSampleAnswer
}) => {
  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
      {/* Top Question Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
            Question {currentIndex + 1} of {Math.max(totalQuestions, 1)}
          </span>
          {question?.difficulty && (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[11px] uppercase">
              {question.difficulty}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Skill: <strong className="text-slate-200">{question?.skillEvaluated || question?.category || 'Technical Reasoning'}</strong>
        </span>
      </div>

      {/* Question Prompt */}
      <div className="space-y-2">
        <h4 className="text-base font-extrabold text-white">
          {question?.title || 'Technical Question'}
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          {question?.description || 'Explain your technical approach, edge cases, and reasoning.'}
        </p>
        {question?.expectedConcepts && (
          <p className="text-xs text-slate-400">
            Core Concepts: <span className="font-mono text-indigo-300">{question.expectedConcepts}</span>
          </p>
        )}
      </div>

      {/* Interviewer Push to Screen Control */}
      {isInterviewer && onPushQuestion && (
        <div className="p-3 bg-indigo-950/40 rounded-2xl border border-indigo-800/60 flex items-center justify-between text-xs">
          <span className="text-indigo-200 font-medium">
            Asking verbally? Click to synchronize this question on candidate's screen:
          </span>
          <button
            onClick={onPushQuestion}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center space-x-1.5 shadow-sm shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Push to Screen</span>
          </button>
        </div>
      )}

      {/* Answer Submission Box */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center">
            <Edit3 className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            {isInterviewer ? "Candidate's Spoken / Transcribed Explanation:" : "Your Technical Explanation / Code Response:"}
          </span>
          {onSampleAnswer && (
            <button
              onClick={onSampleAnswer}
              className="text-amber-400 hover:text-amber-300 transition flex items-center space-x-1 text-[11px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Sample Answer</span>
            </button>
          )}
        </div>

        <textarea
          rows={5}
          value={answerText}
          onChange={e => onAnswerChange(e.target.value)}
          placeholder="Type solution, architectural trade-offs, time complexity, or transcribe candidate spoken points..."
          className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
        />
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-slate-500 flex items-center">
          <Mic className="w-3.5 h-3.5 mr-1 text-slate-400" />
          Face-to-face verbal dialogue & live AI evaluation
        </span>
        <button
          onClick={onSubmitAnswer}
          disabled={isEvaluating || !answerText.trim()}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition flex items-center space-x-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isEvaluating ? 'Evaluating with AI...' : 'Submit & AI Evaluate'}</span>
        </button>
      </div>
    </div>
  );
};
