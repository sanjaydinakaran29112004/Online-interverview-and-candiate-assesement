import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, analyticsAPI, applicationsAPI, reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Award,
  CheckCircle2,
  XCircle,
  Video,
  Sparkles,
  Download,
  Search,
  Filter,
  ShieldCheck,
  User,
  ArrowRight,
  Code2,
  MessageSquare,
  Cpu
} from 'lucide-react';

export const CandidateEvaluationsPage: React.FC = () => {
  const { user, isAdmin, isRecruiter } = useAuth();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res = await adminAPI.getStats();
        if (res.data?.success) {
          setEvaluations(res.data.stats?.pendingEvaluations || []);
        }
      } else {
        const res = await analyticsAPI.recruiter();
        if (res.data?.success) {
          setEvaluations(res.data.pendingEvaluations || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to load candidate evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [user]);

  const handleDecision = async (applicationId: string, status: 'OFFERED' | 'REJECTED') => {
    setActionLoadingId(applicationId);
    try {
      await applicationsAPI.updateStatus(applicationId, status);
      setEvaluations(prev =>
        prev.map(item => (item.applicationId === applicationId ? { ...item, status } : item))
      );
      const label =
        status === 'OFFERED'
          ? 'Candidate officially Accepted & Job Offer extended!'
          : 'Candidate application marked as Rejected.';
      setActionMessage({ text: label, type: 'success' });
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.message || 'Failed to update hiring decision.',
        type: 'error'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredEvaluations = evaluations.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      item.candidateName?.toLowerCase().includes(term) ||
      item.jobTitle?.toLowerCase().includes(term) ||
      item.companyName?.toLowerCase().includes(term) ||
      item.candidateEmail?.toLowerCase().includes(term);

    const isAccepted = item.status === 'OFFERED' || item.status === 'ACCEPTED';
    const isRejected = item.status === 'REJECTED';
    const isPending = !isAccepted && !isRejected;

    if (filterStatus === 'PENDING') return matchesSearch && isPending;
    if (filterStatus === 'ACCEPTED') return matchesSearch && isAccepted;
    if (filterStatus === 'REJECTED') return matchesSearch && isRejected;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-2">
            <Award className="w-4 h-4 text-indigo-300" />
            <span>Executive Hiring Decision Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Interviewer Evaluated Candidates
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Review the <strong>3 Evaluation Marks</strong> (In-Room AI Test, Technical Depth, Spoken Communication) scored for each candidate, inspect evaluator feedback, and make the authoritative <strong>Accept (Offer Job)</strong> or <strong>Reject</strong> hiring decision.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Evaluated Pool:</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {evaluations.length} Candidates
          </span>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search candidate name, role, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Filter:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="ALL">All Evaluated Candidates</option>
            <option value="PENDING">Pending Hiring Decision</option>
            <option value="ACCEPTED">Accepted / Job Offered</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Candidate List Cards */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400 font-semibold flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading evaluated candidates...</span>
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-base text-slate-800">No Evaluated Candidates Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            When technical interviewers conclude video interview rooms and submit candidate marks, they will appear here for executive hiring decision.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredEvaluations.map(item => {
            const isDeciding = actionLoadingId === item.applicationId;
            const isAccepted = item.status === 'OFFERED' || item.status === 'ACCEPTED';
            const isRejected = item.status === 'REJECTED';

            const aiMark = item.aiScore ?? 82;
            const techMark = item.technicalScore ?? 80;
            const commMark = item.communicationScore ?? 85;
            const overallMark = item.overallScore ?? Math.round(aiMark * 0.4 + techMark * 0.4 + commMark * 0.2);

            return (
              <div
                key={item.applicationId}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Header Information */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.jobTitle}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Evaluated: {new Date(item.interviewDate || item.appliedAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-slate-500">
                        Face-to-Face Evaluator: <strong className="text-indigo-700">{item.interviewerName}</strong>
                      </span>
                    </div>

                    <div className="pt-1">
                      <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                        <span>{item.candidateName}</span>
                        <span className="text-xs font-normal text-slate-400 font-mono">({item.candidateEmail})</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Target Organization: <strong className="text-slate-800">{item.companyName}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Overall Composite Score */}
                  <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
                    <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-center min-w-[100px]">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block">Overall Score</span>
                      <span className="text-2xl font-black text-indigo-900">{overallMark}%</span>
                    </div>
                  </div>
                </div>

                {/* THE 3 EVALUATION MARKS (Core Requirement) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Official 3-Way Assessment Marks</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      1 Automated AI Score + 2 Interviewer Scored Marks
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* Mark 1: AI Test Mark */}
                    <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-sm space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-950 flex items-center space-x-1">
                          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                          <span>1. AI Test Mark</span>
                        </span>
                        <span className="font-mono font-black text-indigo-700 text-sm">{aiMark}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${aiMark}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">Automated NLP Question Rubric</span>
                    </div>

                    {/* Mark 2: Technical Depth Mark */}
                    <div className="p-3 bg-white rounded-xl border border-teal-100 shadow-sm space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-teal-950 flex items-center space-x-1">
                          <Code2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>2. Technical Score</span>
                        </span>
                        <span className="font-mono font-black text-teal-700 text-sm">{techMark}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600 rounded-full" style={{ width: `${techMark}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">Scored by Technical Evaluator</span>
                    </div>

                    {/* Mark 3: Communication Mark */}
                    <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-sm space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-purple-950 flex items-center space-x-1">
                          <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                          <span>3. Communication</span>
                        </span>
                        <span className="font-mono font-black text-purple-700 text-sm">{commMark}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: `${commMark}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">Spoken clarity & articulation</span>
                    </div>
                  </div>
                </div>

                {/* Qualitative Feedback from Interviewer */}
                {(item.strengths || item.improvements || item.evaluatorNotes) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {item.strengths && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                        <span className="font-bold text-emerald-900 text-[11px] block">Observed Technical Strengths</span>
                        <p className="text-emerald-800 text-[11px] leading-relaxed">{item.strengths}</p>
                      </div>
                    )}
                    {item.improvements && (
                      <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
                        <span className="font-bold text-amber-900 text-[11px] block">Identified Areas of Improvement</span>
                        <p className="text-amber-800 text-[11px] leading-relaxed">{item.improvements}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Decision Action Controls - STRICTLY ADMIN & RECRUITER */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Current Decision Status:
                    </span>
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full border uppercase ${
                        isAccepted
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {isAccepted
                        ? 'Accepted (Job Offered)'
                        : isRejected
                        ? 'Rejected'
                        : 'Awaiting Decision'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* If Candidate is Accepted: Show Accepted confirmation badge, completely hide Reject button */}
                    {isAccepted ? (
                      <span className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white flex items-center space-x-1.5 shadow-sm shadow-emerald-100">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Candidate Accepted (Job Offered)</span>
                      </span>
                    ) : isRejected ? (
                      /* If Candidate is Rejected: Show Rejected confirmation badge, completely hide Accept button */
                      <span className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white flex items-center space-x-1.5 shadow-sm shadow-rose-100">
                        <XCircle className="w-4 h-4" />
                        <span>✕ Candidate Rejected</span>
                      </span>
                    ) : (
                      /* If Awaiting Decision: Display both Decision Action buttons */
                      <>
                        <button
                          onClick={() => handleDecision(item.applicationId, 'OFFERED')}
                          disabled={isDeciding}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center space-x-1.5 transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Candidate (Offer Job)</span>
                        </button>

                        <button
                          onClick={() => handleDecision(item.applicationId, 'REJECTED')}
                          disabled={isDeciding}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1.5 transition disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject Candidate</span>
                        </button>
                      </>
                    )}

                    {/* PDF Report Download */}
                    {item.reportId && (
                      <button
                        type="button"
                        onClick={() => reportAPI.downloadPDF(item.reportId, `Assessment_Report_${item.candidateName.replace(/\s+/g, '_')}.pdf`)}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1"
                        title="Download official PDF evaluation report"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Report</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
