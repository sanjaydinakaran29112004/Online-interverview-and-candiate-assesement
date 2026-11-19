import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI, applicationsAPI, reportAPI } from '../../services/api';
import {
  ShieldCheck,
  Users,
  Briefcase,
  Video,
  Award,
  Layers,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Clock,
  Eye,
  Activity,
  CheckCircle2,
  AlertCircle,
  Download,
  Check,
  X,
  Sparkles,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [evaluationsList, setEvaluationsList] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getStats();
        if (res.data.success) {
          setStats(res.data.stats);
          if (res.data.stats?.pendingEvaluations) {
            setEvaluationsList(res.data.stats.pendingEvaluations);
          }
        }
      } catch (e) {
        console.error('Failed to load admin stats:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleDecision = async (appId: string, newStatus: string) => {
    setActionLoadingId(appId);
    try {
      await applicationsAPI.updateStatus(appId, newStatus);
      setEvaluationsList(prev =>
        prev.map(item => (item.applicationId === appId ? { ...item, status: newStatus } : item))
      );
    } catch (err: any) {
      console.error('Failed to update hiring decision:', err);
      alert(err.response?.data?.message || 'Failed to update candidate status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <div className="flex items-center space-x-3 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading system governance intelligence & analytics...</span>
        </div>
      </div>
    );
  }

  const roleBreakdown = stats?.roleBreakdown || {};
  const statusBreakdown = stats?.statusBreakdown || {};
  const recentUsers: any[] = stats?.recentUsers || [];

  // Data for Charts
  const roleChartData = stats?.roleChartData || [
    { role: 'Candidates', count: roleBreakdown['CANDIDATE'] || 20, fill: '#10b981' },
    { role: 'Interviewers', count: roleBreakdown['INTERVIEWER'] || 5, fill: '#14b8a6' },
    { role: 'Recruiters', count: roleBreakdown['RECRUITER'] || 3, fill: '#6366f1' },
    { role: 'Administrators', count: roleBreakdown['ADMIN'] || 1, fill: '#8b5cf6' }
  ];

  const activityTrends = stats?.activityTrends || [
    { month: 'Jun', applications: 8, interviews: 3, assessments: 3 },
    { month: 'Jul', applications: 14, interviews: 6, assessments: 5 },
    { month: 'Aug', applications: 22, interviews: 11, assessments: 9 },
    { month: 'Sep', applications: 31, interviews: 17, assessments: 15 },
    { month: 'Oct', applications: 39, interviews: 24, assessments: 22 },
    { month: 'Nov', applications: stats?.totalApplications || 45, interviews: stats?.totalInterviews || 29, assessments: stats?.totalAssessments || 25 }
  ];

  const statusPieData = [
    { name: 'Active Users', value: statusBreakdown['ACTIVE'] || stats?.totalUsers || 29, color: '#10b981' },
    { name: 'Inactive / Pending', value: statusBreakdown['INACTIVE'] || 0, color: '#f59e0b' },
    { name: 'Suspended', value: statusBreakdown['SUSPENDED'] || 0, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const roleColorBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'RECRUITER':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'INTERVIEWER':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>Master Governance Console &bull; Full Platform Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Administration & Analytics</h1>
          <p className="text-sm text-purple-100 mt-1 max-w-2xl leading-relaxed">
            Real-time platform analytics, user account distribution, recruitment trends, and face-to-face candidate evaluations awaiting executive hiring decisions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/users"
            className="px-5 py-2.5 rounded-xl bg-white text-purple-950 font-bold text-sm hover:bg-purple-50 transition shadow-sm flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>User Governance</span>
          </Link>
          <Link
            to="/admin/audit-logs"
            className="px-5 py-2.5 rounded-xl bg-purple-800/80 hover:bg-purple-800 text-white font-bold text-sm border border-purple-500 transition flex items-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trails</span>
          </Link>
        </div>
      </div>

      {/* Core Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{stats?.totalUsers ?? 29}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center font-medium">
            <span className="text-emerald-700 font-bold mr-1">&bull; {roleBreakdown['CANDIDATE'] || 20}</span> Candidates
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Openings</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{stats?.totalJobs ?? 8}</div>
          <div className="text-[11px] text-slate-500 mt-1">Corporate requisitions</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Applications</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{stats?.totalApplications ?? 45}</div>
          <div className="text-[11px] text-slate-500 mt-1">AI parsed resumes</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Interviews</span>
            <Video className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700 mt-2">{stats?.totalInterviews ?? 29}</div>
          <div className="text-[11px] text-slate-500 mt-1">Live WebRTC rooms</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Evaluated</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">{stats?.totalAssessments ?? 25}</div>
          <div className="text-[11px] text-slate-500 mt-1">Finalized rubrics</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Security Audits</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-2">{stats?.auditLogsCount ?? 110}</div>
          <div className="text-[11px] text-slate-500 mt-1">Immutable log events</div>
        </div>
      </div>

      {/* Evaluated Candidates & Administrator Hiring Decision Hub (Face-to-Face Interviewer Feedback & Skill %) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Interviewer Evaluated Candidates — Hiring Decision Hub
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Technical interviewers assessed these candidates face-to-face, scored student skill percentages, and recorded qualitative feedback. Use their evaluations to <strong>Accept (Offer Job)</strong> or <strong>Reject</strong> each applicant.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {evaluationsList.length} Evaluated {evaluationsList.length === 1 ? 'Candidate' : 'Candidates'}
            </span>
          </div>
        </div>

        {evaluationsList.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <Video className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-800">No Evaluated Interviews Awaiting Decision</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              When technical interviewers conclude live WebRTC video assessments, their evaluated student skill percentages and feedback will appear here for Administrator and Recruiter decisions.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {evaluationsList.map((item: any) => {
              const isDeciding = actionLoadingId === item.applicationId;
              const isAccepted = item.status === 'OFFERED';
              const isRejected = item.status === 'REJECTED';
              const isRound2 = item.status === 'TECHNICAL_ROUND_2';

              return (
                <div
                  key={item.applicationId}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition"
                >
                  {/* Top Candidate & Interviewer Header */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                          {item.jobTitle}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                          item.recommendation === 'STRONG_HIRE' || item.recommendation === 'HIRE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : item.recommendation === 'NEXT_ROUND'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : item.recommendation === 'HOLD'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          Interviewer Recommendation: {item.recommendation.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Evaluated: {new Date(item.interviewDate || item.appliedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="pt-1">
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                          <span>{item.candidateName}</span>
                          <span className="text-xs font-normal text-slate-400 font-mono">({item.candidateEmail})</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Company: <strong className="text-slate-700">{item.companyName}</strong> &bull; Face-to-Face Evaluator: <strong className="text-indigo-700">{item.interviewerName}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center min-w-[90px] shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Score</span>
                        <span className="text-xl font-black text-indigo-700">{item.overallScore}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Student Skill Competency Percentages (The Core Requirement) */}
                  {item.skills && item.skills.length > 0 && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Interviewer Rated Student Skill Competencies (%)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Scored during live technical session</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                        {item.skills.map((sk: any, idx: number) => {
                          const sc = Math.round(sk.score);
                          return (
                            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-800 truncate max-w-[120px]">{sk.skillName}</span>
                                <span className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                  sc >= 80 ? 'text-emerald-700 bg-emerald-50' :
                                  sc >= 60 ? 'text-indigo-700 bg-indigo-50' :
                                  'text-rose-700 bg-rose-50'
                                }`}>
                                  {sc}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    sc >= 80 ? 'bg-emerald-500' : sc >= 60 ? 'bg-indigo-600' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(5, sc))}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interviewer Qualitative Feedback (Strengths, Weaknesses, Notes) */}
                  {(item.strengths || item.improvements || item.evaluatorNotes) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {item.strengths && (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-950">
                          <strong className="font-bold text-emerald-800 block mb-0.5">Observed Strengths:</strong>
                          <p className="text-[11px] leading-relaxed text-emerald-900">{item.strengths}</p>
                        </div>
                      )}
                      {item.improvements && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-950">
                          <strong className="font-bold text-amber-800 block mb-0.5">Areas for Improvement:</strong>
                          <p className="text-[11px] leading-relaxed text-amber-900">{item.improvements}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hiring Decision & Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-200/80">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Hiring Stage:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        isAccepted
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : isRound2
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                      }`}>
                        {isAccepted
                          ? '✓ Accepted & Job Offered'
                          : isRejected
                          ? '✕ Candidate Rejected'
                          : isRound2
                          ? 'Advanced to Technical Round 2'
                          : 'Pending Admin / Recruiter Decision'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      {/* Accept / Offer Job Button */}
                      <button
                        onClick={() => handleDecision(item.applicationId, 'OFFERED')}
                        disabled={isDeciding || isAccepted}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm ${
                          isAccepted
                            ? 'bg-emerald-100 text-emerald-700 cursor-default border border-emerald-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isAccepted ? 'Job Offered' : 'Accept / Offer Job'}</span>
                      </button>

                      {/* Advance to Round 2 */}
                      <button
                        onClick={() => handleDecision(item.applicationId, 'TECHNICAL_ROUND_2')}
                        disabled={isDeciding || isRound2}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
                          isRound2
                            ? 'bg-purple-100 text-purple-700 border-purple-200 cursor-default'
                            : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-300'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Round 2</span>
                      </button>

                      {/* Reject Candidate Button */}
                      <button
                        onClick={() => handleDecision(item.applicationId, 'REJECTED')}
                        disabled={isDeciding || isRejected}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                          isRejected
                            ? 'bg-rose-100 text-rose-700 cursor-default border border-rose-200'
                            : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                      </button>

                      {/* View 360 Profile */}
                      {item.candidateUserId && (
                        <button
                          onClick={() => navigate(`/admin/users?viewId=${item.candidateUserId}`)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>360&deg; Dossier</span>
                        </button>
                      )}

                      {/* Download PDF */}
                      {item.reportId && (
                        <a
                          href={reportAPI.downloadPDFUrl(item.reportId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytical Charts & Governance Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution Bar Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">User Account Role Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Active personas provisioned across enterprise workspace</p>
            </div>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="role" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1b4b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" name="Accounts" radius={[6, 6, 0, 0]}>
                  {roleChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Account Status Breakdown Pie Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Security & Activation Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ratio of active, pending, and suspended credentials</p>
            </div>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 pt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recruitment Pipeline Trends Area Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">System Operational Activity (Last 6 Months)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Comparative throughput of candidate applications vs live video interviews</p>
          </div>
          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>

        <div className="h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityTrends}>
              <defs>
                <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e1b4b',
                  borderRadius: '12px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px'
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="applications"
                name="Applications"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorApps)"
              />
              <Area
                type="monotone"
                dataKey="interviews"
                name="Live Interviews"
                stroke="#14b8a6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorInterviews)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Last 5 Registered Users Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Recently Registered Users (Last 5 Accounts)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Latest user accounts provisioned in the system database with 360&deg; profile inspection
            </p>
          </div>

          <Link
            to="/admin/users"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
          >
            <span>View All {stats?.totalUsers ?? 29} Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Domain / Specialty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No users found in database.
                  </td>
                </tr>
              ) : (
                recentUsers.map(u => {
                  const domainInfo =
                    u.candidateProfile?.headline ||
                    u.recruiterProfile?.companyName ||
                    u.interviewerProfile?.technicalDomain ||
                    'System Administrator';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{u.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleColorBadge(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">{domainInfo}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{u.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => navigate(`/admin/users?viewId=${u.id}`)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition inline-flex items-center space-x-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>360&deg; Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
