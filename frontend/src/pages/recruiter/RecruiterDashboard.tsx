import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';
import {
  Briefcase,
  Users,
  Video,
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles
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
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsAPI.recruiter();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-400">Loading recruiter analytics...</div>;
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-brand-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Recruiter Intelligence Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Talent Acquisition & Assessment</h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1">
            Real-time pipeline monitoring, AI scoring rubrics, and candidate ranking.
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
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{summary.totalJobs ?? 0}</div>
          <span className="text-xs text-indigo-600 font-semibold mt-1 inline-block">Active job postings</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applications</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{summary.totalApplications ?? 0}</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">{summary.shortlistedCount ?? 0} Shortlisted</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interviews Conducted</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{summary.completedInterviews ?? 0}</div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">{summary.scheduledInterviews ?? 0} upcoming</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Candidate Score</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{summary.averageScore ?? 0}%</div>
          <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">5-Metric Rubric Average</span>
        </div>
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
