import React, { useState, useEffect } from 'react';
import { interviewsAPI, reportAPI } from '../../services/api';
import { Interview } from '../../types';
import {
  Award,
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export const AssessmentHistoryPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await interviewsAPI.list({ status: 'COMPLETED' });
        if (res.data.success) {
          setInterviews(res.data.interviews || []);
        }
      } catch (err) {
        console.error('Failed to load candidate assessments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Candidate Assessment Reports & Audits
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review finalized technical interview performance, AI multi-criteria benchmarks, and download signed PDF audits
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400 font-semibold flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading verified assessment reports...</span>
        </div>
      ) : interviews.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">No Finalized Assessments Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            When you complete scheduled technical interviews, your performance scores across technical depth, spoken clarity, and resume alignment will be displayed here along with official PDF evaluation reports.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {interviews.map(inv => {
            const report = (inv as any).assessmentReport;
            let parsedData: any = {};
            if (report?.reportData) {
              try {
                parsedData = JSON.parse(report.reportData);
              } catch {
                parsedData = {};
              }
            }

            const appStatus = inv.application?.status;
            const recStatus = report?.recruiterRecommendation || parsedData.recommendation;
            const isAccepted = appStatus === 'OFFERED' || appStatus === 'ACCEPTED' || recStatus === 'OFFERED' || recStatus === 'ACCEPTED';
            const isRejected = appStatus === 'REJECTED' || recStatus === 'REJECTED';

            const aiScore = parsedData.aiScore ?? 0;
            const technicalScore = parsedData.technicalScore ?? 0;
            const interviewScore = parsedData.communicationScore ?? parsedData.interviewScore ?? 0;
            const overallScore = parsedData.overallScore ?? Math.round(aiScore * 0.4 + technicalScore * 0.4 + interviewScore * 0.2);
            const skills = parsedData.skills || [];

            // Deduplicate questions to strictly ensure 1 question only displays once
            const rawAnswers = parsedData.answers || [];
            const answers = rawAnswers.filter((ans: any, index: number, self: any[]) =>
              index === self.findIndex((a: any) => (a.questionTitle || a.id) === (ans.questionTitle || ans.id))
            );
            const isExpanded = expandedId === inv.id;

            return (
              <div
                key={inv.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        <span>Assessment Finalized</span>
                      </span>

                      {/* Explicit Decision Badge */}
                      {isAccepted ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 uppercase flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          <span>Candidate Accepted (Job Offered)</span>
                        </span>
                      ) : isRejected ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-300 uppercase flex items-center space-x-1">
                          <span>✕ Application Rejected</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 uppercase flex items-center space-x-1">
                          <span>⏳ Awaiting Final Decision</span>
                        </span>
                      )}

                      <span className="text-xs text-slate-400 flex items-center font-medium">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(inv.scheduledStartTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900">{inv.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {inv.application?.job?.companyName || 'Corporate Technology Unit'} &bull; Room: <span className="font-mono text-indigo-600 font-semibold">{inv.roomCode}</span>
                      </p>
                    </div>

                    {/* Summary Feedback */}
                    {parsedData.summaryFeedback && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed max-w-2xl">
                        <strong className="text-slate-800 font-semibold">Evaluator Notes:</strong> {parsedData.summaryFeedback}
                      </p>
                    )}
                  </div>

                  {/* Competency Score Breakdown & Actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    <div className="grid grid-cols-4 gap-2 text-center w-full sm:w-auto">
                      <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 min-w-[65px]">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">AI Test</span>
                        <span className="text-sm font-extrabold text-indigo-600">{aiScore}%</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 min-w-[65px]">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Technical</span>
                        <span className="text-sm font-extrabold text-slate-900">{technicalScore}%</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 min-w-[65px]">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Comm</span>
                        <span className="text-sm font-extrabold text-slate-900">{interviewScore}%</span>
                      </div>
                      <div className="p-2.5 bg-indigo-50 rounded-2xl border border-indigo-200 min-w-[70px]">
                        <span className="text-[9px] uppercase font-bold text-indigo-700 block">Overall</span>
                        <span className="text-sm font-black text-indigo-700">{overallScore}%</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      {report && (
                        <button
                          type="button"
                          onClick={() => reportAPI.downloadPDF(report.id, `Signed_Assessment_Report_${inv.roomCode}.pdf`)}
                          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-100"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Signed PDF</span>
                        </button>
                      )}
                      {answers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center space-x-1"
                        >
                          <span>{isExpanded ? 'Hide Rubric Breakdown' : 'View Question Breakdown'}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question-by-Question Rubric Breakdown (Collapsible) */}
                {isExpanded && answers.length > 0 && (
                  <div className="bg-slate-50/70 p-6 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Individual Question Performance Rubrics ({answers.length})</span>
                    </h4>

                    <div className="space-y-2.5">
                      {answers.map((ans: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/80 text-xs space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{idx + 1}. {ans.questionTitle}</span>
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {ans.score}/100
                            </span>
                          </div>
                          {ans.answerText && (
                            <p className="text-slate-500 italic bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                              "{ans.answerText}"
                            </p>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                            <div className="text-emerald-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                              <strong>Strength:</strong> {ans.strengths}
                            </div>
                            <div className="text-amber-900 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                              <strong>Improvement Area:</strong> {ans.improvements}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
