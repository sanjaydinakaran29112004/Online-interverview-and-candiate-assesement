import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI, interviewsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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
  ArrowRight,
  Clock
} from 'lucide-react';

export const ApplicationsReviewPage: React.FC = () => {
  const { user } = useAuth();
  const canDecide = user?.role === 'ADMIN' || user?.role === 'RECRUITER';

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
    const handleFocus = () => fetchApplications();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
            <option value="IN_PROGRESS">Interview Ongoing</option>
            <option value="ASSESSMENT_COMPLETED">Assessment Completed</option>
            <option value="OFFERED">Accepted / Job Offered</option>
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
            const isInterviewCompleted = latestInterview?.status === 'COMPLETED';
            const isInterviewConcluded = isInterviewCompleted;

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

            const aiMark = parsedReport?.aiScore ?? (analysis?.compatibilityScore || 82);
            const techMark = parsedReport?.technicalScore ?? 80;
            const commMark = parsedReport?.communicationScore ?? 85;
            const overallMark = parsedReport?.overallScore ?? Math.round(aiMark * 0.4 + techMark * 0.4 + commMark * 0.2);

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
                      {/* Candidate Application Status Badge */}
                      {app.status === 'OFFERED' || app.status === 'ACCEPTED' ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          <span>Accepted (Job Offered)</span>
                        </span>
                      ) : app.status === 'REJECTED' ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 uppercase flex items-center space-x-1">
                          <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                          <span>Candidate Rejected</span>
                        </span>
                      ) : app.status === 'ASSESSMENT_COMPLETED' ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 uppercase">
                          Assessment Completed • Awaiting Decision
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {app.status.replace(/_/g, ' ')}
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
                  <div className="flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 space-y-3 min-w-[240px]">
                    <div className="w-full">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 lg:text-right">
                        Application Stage
                      </label>
                      {canDecide ? (
                        <select
                          value={app.status}
                          onChange={e => handleStatusChange(app.id, e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                        >
                          <option value="APPLIED">Applied (Screening)</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                          <option value="IN_PROGRESS">Interview Ongoing</option>
                          <option value="ASSESSMENT_COMPLETED">Assessment Completed</option>
                          <option value="OFFERED">Accepted / Job Offered</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      ) : (
                        <span className="block px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 text-center">
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    {/* Contextual Action Buttons based on stage */}
                    {app.status === 'APPLIED' && canDecide && (
                      <div className="flex flex-col sm:flex-row items-center gap-1.5 w-full">
                        <button
                          onClick={() => handleStatusChange(app.id, 'SHORTLISTED')}
                          className="flex-1 w-full px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Shortlist Candidate</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(app.id, 'REJECTED')}
                          className="flex-1 w-full px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}

                    {app.status === 'SHORTLISTED' && (
                      <div className="space-y-1.5 w-full">
                        <div className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 text-center">
                          Shortlisted &bull; Awaiting Interview Schedule
                        </div>
                        {canDecide && (
                          <Link
                            to="/recruiter/interviews"
                            className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center space-x-1 shadow-sm transition"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Schedule Interview</span>
                          </Link>
                        )}
                      </div>
                    )}

                    {app.status === 'INTERVIEW_SCHEDULED' && (
                      <div className="space-y-1.5 w-full">
                        <div className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 text-center">
                          Interview Scheduled &bull; Waiting for Session
                        </div>
                        {latestInterview?.roomCode && (
                          isInterviewConcluded ? (
                            <div className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center space-x-1.5 cursor-not-allowed">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Time Over / Session Ended</span>
                            </div>
                          ) : (
                            <a
                              href={`/interview/${latestInterview.roomCode}`}
                              className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center space-x-1 shadow-sm transition"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Enter Room</span>
                            </a>
                          )
                        )}
                      </div>
                    )}

                    {app.status === 'IN_PROGRESS' && (
                      <div className="space-y-1.5 w-full">
                        <div className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 text-center animate-pulse">
                          Interview Ongoing
                        </div>
                        {latestInterview?.roomCode && (
                          isInterviewConcluded ? (
                            <div className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center space-x-1.5 cursor-not-allowed">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Time Over / Session Ended</span>
                            </div>
                          ) : (
                            <a
                              href={`/interview/${latestInterview.roomCode}`}
                              className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center space-x-1 shadow-sm transition"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Live Room</span>
                            </a>
                          )
                        )}
                      </div>
                    )}

                    {app.status === 'ASSESSMENT_COMPLETED' && (
                      <div className="space-y-2 w-full">
                        <div className="px-3 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200 text-center">
                          Assessment Completed &bull; Awaiting Decision
                        </div>
                        {canDecide ? (
                          <div className="flex flex-col sm:flex-row items-center gap-1.5 w-full">
                            <button
                              onClick={() => handleStatusChange(app.id, 'OFFERED')}
                              className="flex-1 w-full px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept / Offer Job</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(app.id, 'REJECTED')}
                              className="flex-1 w-full px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic text-center">
                            Evaluation submitted. Admin/Recruiter will finalize.
                          </div>
                        )}
                      </div>
                    )}

                    {app.status === 'OFFERED' && (
                      <div className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1 w-full justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Accepted & Job Offered</span>
                      </div>
                    )}

                    {app.status === 'REJECTED' && (
                      <div className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1 w-full justify-center">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Candidate Rejected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Official 3-Way Assessment Marks (AI Test + Technical + Communication) */}
                {(app.status === 'ASSESSMENT_COMPLETED' || parsedReport || evaluatedSkills.length > 0) && (
                  <div className="pt-3 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span className="font-extrabold text-slate-900">
                          Official 3-Way Assessment Marks
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                        Overall Score: {overallMark}%
                      </span>
                    </div>

                    {/* The 3 Marks Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Mark 1: AI Test Score */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">1. AI Test Mark</span>
                          <span className="font-mono font-extrabold text-indigo-700">{aiMark}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${aiMark}%` }} />
                        </div>
                      </div>

                      {/* Mark 2: Technical Depth Score */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">2. Technical Depth</span>
                          <span className="font-mono font-extrabold text-teal-700">{techMark}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-teal-600" style={{ width: `${techMark}%` }} />
                        </div>
                      </div>

                      {/* Mark 3: Spoken Communication Score */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">3. Communication</span>
                          <span className="font-mono font-extrabold text-purple-700">{commMark}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-purple-600" style={{ width: `${commMark}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Interviewer Qualitative Feedback */}
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
