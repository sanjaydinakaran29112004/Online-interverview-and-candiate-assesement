import React, { useState, useEffect } from 'react';
import { applicationsAPI, interviewsAPI } from '../../services/api';
import { Application } from '../../types';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Video,
  FileText,
  Calendar,
  Sparkles,
  ChevronDown,
  Award,
  ThumbsUp,
  ThumbsDown,
  ArrowRight
} from 'lucide-react';

export const ApplicationsReviewPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApplications = async () => {
    try {
      const res = await applicationsAPI.list({
        status: filterStatus || undefined
      });
      if (res.data.success) {
        setApplications(res.data.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await applicationsAPI.updateStatus(appId, newStatus);
      setApplications(prev =>
        prev.map(a => (a.id === appId ? { ...a, status: newStatus as any } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredApps = applications.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.candidate?.user?.name?.toLowerCase().includes(term) ||
      a.job?.title?.toLowerCase().includes(term) ||
      a.candidate?.user?.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Review Candidate Applications</h1>
          <p className="text-xs text-slate-500 mt-1">Examine AI resume compatibility, extracted skills, and advance candidate stages</p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="">All Pipeline Stages</option>
            <option value="APPLIED">Applied (Screening)</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
            <option value="RECOMMENDED_HIRE">Recommended for Hire</option>
            <option value="OFFERED">Job Offered</option>
            <option value="TECHNICAL_ROUND_2">Technical Round 2</option>
            <option value="UNDER_REVIEW">Under Review / Hold</option>
            <option value="COMPLETED">Assessment Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Cards */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading candidate submissions...</div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-700">No applications found</h3>
          <p className="text-xs text-slate-400 mt-1">No candidate records match the selected filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map(app => {
            const analysis = app.resumeAnalyses?.[0];
            let matchedSkillsList: string[] = [];
            let missingSkillsList: string[] = [];
            if (analysis) {
              if (Array.isArray(analysis.matchedSkills)) {
                matchedSkillsList = analysis.matchedSkills;
              } else if (typeof analysis.matchedSkills === 'string') {
                try {
                  matchedSkillsList = JSON.parse(analysis.matchedSkills);
                } catch {
                  matchedSkillsList = [];
                }
              }

              if (Array.isArray(analysis.missingSkills)) {
                missingSkillsList = analysis.missingSkills;
              } else if (typeof analysis.missingSkills === 'string') {
                try {
                  missingSkillsList = JSON.parse(analysis.missingSkills);
                } catch {
                  missingSkillsList = [];
                }
              }
            }

            const latestInterview = app.interviews?.[0];
            const assessment = (app as any).assessments?.[0];
            const report = latestInterview?.assessmentReport || assessment?.report;
            let parsedReport: any = null;
            if (report?.reportData) {
              try {
                parsedReport = JSON.parse(report.reportData);
              } catch {}
            }

            const evaluatedSkills = (assessment?.skillAssessments && assessment.skillAssessments.length > 0)
              ? assessment.skillAssessments
              : (parsedReport?.interviewerSkillScores || parsedReport?.skills || []);

            const evaluatorName = latestInterview?.participants?.find((p: any) => p.user?.role === 'INTERVIEWER')?.user?.name || parsedReport?.interviewerName;
            const recommendation = report?.recruiterRecommendation || parsedReport?.recommendation;
            const strengths = parsedReport?.strengths || assessment?.strengthsSummary;
            const improvements = parsedReport?.improvements || assessment?.weaknessesSummary;

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col space-y-4 hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="space-y-3 max-w-2xl flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {app.job?.title}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Applied: {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                      {recommendation && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                          recommendation === 'STRONG_HIRE' || recommendation === 'HIRE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : recommendation === 'NEXT_ROUND' || recommendation === 'TECHNICAL_ROUND_2'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : recommendation === 'HOLD'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          Evaluator: {recommendation.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {app.candidate?.user?.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {app.candidate?.user?.email} &bull; {app.candidate?.headline} &bull; {app.candidate?.experienceYears} yrs exp
                      </p>
                    </div>

                    {/* AI Analysis Summary Pill */}
                    {analysis && (
                      <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-indigo-950 flex items-center">
                            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                            AI Match Rating
                          </span>
                          <span className="font-black text-indigo-600 text-sm">
                            {analysis.compatibilityScore}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal">
                          {analysis.scoreExplanation}
                        </p>

                        <div className="pt-2 flex flex-wrap gap-1 text-[10px]">
                          <span className="font-bold text-emerald-700 mr-1">Matched:</span>
                          {matchedSkillsList.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold">
                              {s}
                            </span>
                          ))}
                          {missingSkillsList.length > 0 && (
                            <>
                              <span className="font-bold text-rose-700 ml-2 mr-1">Missing:</span>
                              {missingSkillsList.map(s => (
                                <span key={s} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-semibold">
                                  {s}
                                </span>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Decision Controls */}
                  <div className="flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 space-y-3 min-w-[220px]">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 lg:text-right">
                        Hiring Decision Stage
                      </label>
                      <select
                        value={app.status}
                        onChange={e => handleStatusChange(app.id, e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                      >
                        <option value="APPLIED">Applied (Screening)</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                        <option value="RECOMMENDED_HIRE">Recommended for Hire</option>
                        <option value="OFFERED">Job Offered (Accept)</option>
                        <option value="TECHNICAL_ROUND_2">Technical Round 2</option>
                        <option value="UNDER_REVIEW">Under Review / Hold</option>
                        <option value="COMPLETED">Assessment Completed</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>

                    {/* Quick 1-Click Hiring Decision Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-1.5 w-full">
                      <button
                        onClick={() => handleStatusChange(app.id, 'OFFERED')}
                        className={`flex-1 w-full px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                          app.status === 'OFFERED'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept / Offer</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.id, 'REJECTED')}
                        className={`flex-1 w-full px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                          app.status === 'REJECTED'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      {latestInterview?.status === 'COMPLETED' ? (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Interview Finished</span>
                        </span>
                      ) : latestInterview?.roomCode ? (
                        <a
                          href={`/interview/${latestInterview.roomCode}`}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5 mr-1" />
                          <span>Enter Room</span>
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Interviewer Face-to-Face Skill Evaluation Hub */}
                {(evaluatedSkills.length > 0 || strengths || improvements) && (
                  <div className="pt-3 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span className="font-extrabold text-slate-900">
                          Interviewer Face-to-Face Evaluation & Skill Scores (%)
                        </span>
                      </div>
                      {evaluatorName && (
                        <span className="text-[11px] text-slate-500">
                          Evaluated by: <strong className="text-indigo-700 font-bold">{evaluatorName}</strong>
                        </span>
                      )}
                    </div>

                    {/* Skill Competency Progress Bars */}
                    {evaluatedSkills.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                        {evaluatedSkills.map((sk: any, idx: number) => {
                          const sc = Math.round(sk.score);
                          return (
                            <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200/80 space-y-1 shadow-sm">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-800">{sk.skillName}</span>
                                <span className="font-mono font-extrabold text-indigo-700">{sc}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    sc >= 85 ? 'bg-emerald-500' : sc >= 70 ? 'bg-indigo-500' : sc >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(5, sc))}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Strengths & Improvements */}
                    {(strengths || improvements) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                        {strengths && (
                          <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                            <span className="font-bold text-emerald-900 text-[11px] block">Observed Technical Strengths</span>
                            <p className="text-emerald-800 text-[11px] leading-relaxed">{strengths}</p>
                          </div>
                        )}
                        {improvements && (
                          <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
                            <span className="font-bold text-amber-900 text-[11px] block">Identified Areas of Improvement</span>
                            <p className="text-amber-800 text-[11px] leading-relaxed">{improvements}</p>
                          </div>
                        )}
                      </div>
                    )}
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
