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

      {/* Evaluated Candidates & Administrator Hiring Decision Hub Quick Banner */}
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
          to="/admin/evaluations"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <span>Open Hiring Decisions</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
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
