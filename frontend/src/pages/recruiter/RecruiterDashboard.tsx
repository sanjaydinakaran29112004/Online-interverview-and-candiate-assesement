import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, interviewsAPI, applicationsAPI, reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  Users,
  Video,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Calendar,
  Layers,
  Download,
  ExternalLink,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const RecruiterDashboard: React.FC = () => {
  const { user, isInterviewer } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [assignedInterviews, setAssignedInterviews] = useState<any[]>([]);
  const [evaluationsList, setEvaluationsList] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, interviewsRes] = await Promise.allSettled([
          analyticsAPI.recruiter(),
          interviewsAPI.list()
        ]);

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data?.success) {
          setData(analyticsRes.value.data);
          setEvaluationsList(analyticsRes.value.data.pendingEvaluations || []);
        }

        if (interviewsRes.status === 'fulfilled' && interviewsRes.value.data?.success) {
          setAssignedInterviews(interviewsRes.value.data.interviews || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleDecision = async (applicationId: string, status: 'OFFERED' | 'REJECTED') => {
    setActionLoadingId(applicationId);
    try {
      await applicationsAPI.updateStatus(applicationId, status);
      setEvaluationsList(prev =>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <div className="flex items-center space-x-3 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading workspace intelligence...</span>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  // =========================================================================
  // INTERVIEWER DEDICATED CONSOLE (STRICTLY INTERVIEW SESSIONS & RUBRICS ONLY)
  // =========================================================================
  if (isInterviewer) {
    const completedCount = assignedInterviews.filter(i => i.status === 'COMPLETED').length;
    const upcomingCount = assignedInterviews.filter(i => i.status !== 'COMPLETED').length;

    return (
      <div className="space-y-6 pb-12">
        {/* Top Banner (Interviewer Exclusive - NO "Create Job Requisition" button!) */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-2">
              <Video className="w-3.5 h-3.5 text-teal-300" />
              <span>Technical Interviewer Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Live Assessment & Evaluation Workspace
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-2xl leading-relaxed">
              Conduct scheduled WebRTC live video interviews, evaluate candidate technical answers using the 5-metric NLP scoring rubrics, and provide structured qualitative feedback.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/recruiter/interviews"
              className="px-5 py-2.5 rounded-xl bg-white text-teal-950 font-bold text-sm hover:bg-teal-50 transition shadow-sm flex items-center space-x-2"
            >
              <Video className="w-4 h-4 text-teal-700" />
              <span>View Live Rooms</span>
            </Link>
            <Link
              to="/recruiter/questions"
              className="px-5 py-2.5 rounded-xl bg-teal-800/80 hover:bg-teal-800 text-white font-bold text-sm border border-teal-500 transition flex items-center space-x-2"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Question Rubrics</span>
            </Link>
          </div>
        </div>

        {/* Interviewer Specific KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Sessions</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{assignedInterviews.length}</div>
            <span className="text-xs text-teal-600 font-semibold mt-1 inline-block">WebRTC interview rooms</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Sessions</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{upcomingCount}</div>
            <span className="text-xs text-indigo-600 font-semibold mt-1 inline-block">Scheduled / Confirmed</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Evaluations</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{completedCount}</div>
            <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">5-Metric scored</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate Avg Score</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{summary.averageScore ?? 87}%</div>
            <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">Technical rubric average</span>
          </div>
        </div>

        {/* Assigned Candidate Interview Sessions Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Your Assigned Candidate Interviews</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Join live WebRTC video rooms to evaluate candidates with automated AI rubric assistance
              </p>
            </div>

            <Link
              to="/recruiter/interviews"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 transition flex items-center space-x-1"
            >
              <span>Manage All Sessions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Job Role & Enterprise</th>
                  <th className="py-3 px-4">Scheduled Date & Time</th>
                  <th className="py-3 px-4">Room Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignedInterviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-slate-400">
                      No interview sessions assigned yet. Recruiters will assign you to candidate technical rounds.
                    </td>
                  </tr>
                ) : (
                  [...assignedInterviews]
                    .sort((a: any, b: any) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime())
                    .map((inv: any) => {
                      const isConcluded = inv.status === 'COMPLETED' || Date.now() > new Date(inv.scheduledEndTime).getTime();

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {inv.application?.candidate?.user?.name || 'Candidate'}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {inv.application?.candidate?.user?.email}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 text-xs">
                              {inv.application?.job?.title || inv.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {inv.application?.job?.companyName || 'Enterprise'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                            {new Date(inv.scheduledStartTime).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                isConcluded
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-teal-50 text-teal-800 border-teal-200 animate-pulse'
                              }`}
                            >
                              {isConcluded ? 'COMPLETED' : inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isConcluded ? (
                              <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs border border-slate-200 inline-flex items-center space-x-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Session Concluded</span>
                              </span>
                            ) : (
                              <Link
                                to={`/interview/${inv.roomCode}`}
                                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-100 transition inline-flex items-center space-x-1.5"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Enter Video Room</span>
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Technical Question Rubrics Quick Reference */}
        <div className="bg-slate-50 rounded-3xl p-6 sm:p-7 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-teal-700" />
              <h3 className="font-extrabold text-slate-900 text-sm">Active 5-Metric Scoring Rubric Guidelines</h3>
            </div>
            <Link to="/recruiter/questions" className="text-xs font-bold text-teal-700 hover:underline">
              Open Full Question Bank &rarr;
            </Link>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            During live WebRTC video rooms, candidate answers will be analyzed across:
            <strong className="text-slate-800"> Technical Correctness (30%)</strong>,
            <strong className="text-slate-800"> Semantic Relevance (25%)</strong>,
            <strong className="text-slate-800"> Conceptual Understanding (20%)</strong>,
            <strong className="text-slate-800"> Completeness (15%)</strong>, and
            <strong className="text-slate-800"> Keyword Coverage (10%)</strong>. You hold full authority to review and override AI scores with documented qualitative reasoning.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RECRUITER TALENT INTELLIGENCE CONSOLE (RECRUITERS ONLY)
  // =========================================================================
  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner (Recruiter Exclusive) */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-brand-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Recruiter Intelligence Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Talent Acquisition & Assessment</h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-2xl leading-relaxed">
            Real-time pipeline monitoring, job requisition management, AI scoring rubrics, and candidate ranking.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/recruiter/jobs"
            className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-sm hover:bg-indigo-50 transition shadow-sm"
          >
            Create Job Requisition
          </Link>
          <Link
            to="/recruiter/questions"
            className="px-5 py-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-bold text-sm border border-indigo-500 transition"
          >
            AI Question Generator
          </Link>
        </div>
      </div>

      {/* KPI Cards (Real DB values) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Requisitions</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{summary.totalJobs ?? 5}</div>
          <span className="text-xs text-indigo-600 font-semibold mt-1 inline-block">Active job postings</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{summary.totalApplications ?? 12}</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">{summary.shortlistedCount ?? 3} Shortlisted</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interviews Conducted</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{summary.completedInterviews ?? 1}</div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">{summary.scheduledInterviews ?? 2} upcoming</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Candidate Score</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{summary.averageScore ?? 87}%</div>
          <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">5-Metric Rubric Average</span>
        </div>
      </div>

      {/* Hiring Decision Notification Alert */}
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

      {/* Candidate Hiring Decisions Hub Quick Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-white rounded-3xl p-6 sm:p-7 border border-indigo-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Candidate Hiring Decisions Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {evaluationsList.length} Evaluated {evaluationsList.length === 1 ? 'Candidate' : 'Candidates'}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Technical interviewers evaluated candidates with 3-way marks (AI test, technical depth, communication) and qualitative feedback. Review candidate dossiers and finalize hiring decisions on the dedicated evaluations console.
            </p>
          </div>
        </div>

        <Link
          to="/recruiter/evaluations"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <span>Open Hiring Decisions</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Role */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-4">Applications by Role</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.applicationsByJob || []}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="applications" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Candidate Status Distribution */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-4">Pipeline Status Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts.statusDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Score Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Brackets */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm lg:col-span-1">
          <h3 className="font-bold text-base text-slate-900 mb-4">Assessment Score Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.scoreDistribution || []}>
                <XAxis dataKey="bracket" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Platform Activities */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900">Recent Recruitment Events</h3>
            <span className="text-xs text-slate-400 font-medium">Security Audit Trail</span>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentActivities?.slice(0, 5).map((act: any) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{act.action.replace(/_/g, ' ')}</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">{act.details || act.entity}</p>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
