import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  ShieldCheck,
  Users,
  Briefcase,
  Video,
  Award,
  Layers,
  Cpu,
  ArrowRight,
  Sparkles,
  BarChart3,
  FileCheck,
  FlaskConical,
  Eye
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getStats();
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-16 text-sm text-slate-400">Loading system governance overview...</div>;
  }

  const roleBreakdown = stats?.roleBreakdown || {};

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-brand-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>Master Governance Console &bull; Complete Platform Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Administration & Oversight</h1>
          <p className="text-sm text-purple-100 mt-1 max-w-2xl leading-relaxed">
            Full administrative authority to manage multi-tenant user accounts, oversee all recruitment requisitions, monitor live WebRTC interview sessions, calibrate AI assessment rubrics, and inspect security audit trails.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/users"
            className="px-5 py-2.5 rounded-xl bg-white text-purple-950 font-bold text-sm hover:bg-purple-50 transition shadow-sm"
          >
            Manage All Accounts
          </Link>
          <Link
            to="/admin/ai-settings"
            className="px-5 py-2.5 rounded-xl bg-purple-800/80 hover:bg-purple-800 text-white font-bold text-sm border border-purple-500 transition"
          >
            AI Rubric Calibration
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.totalUsers ?? 0}</div>
          <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">Active platform users</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published Requisitions</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.totalJobs ?? 0}</div>
          <span className="text-xs text-indigo-600 font-semibold mt-1 inline-block">Active job postings</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Interviews</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.totalInterviews ?? 0}</div>
          <span className="text-xs text-teal-600 font-semibold mt-1 inline-block">WebRTC sessions</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Log Events</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.auditLogsCount ?? 0}</div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Security transactions</span>
        </div>
      </div>

      {/* Role Breakdown Cards */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 mb-4">User Population by Role</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="p-5 rounded-2xl bg-purple-50 border border-purple-100">
            <div className="font-bold text-purple-900 text-sm">Administrators</div>
            <div className="text-3xl font-black text-purple-700 mt-1">{roleBreakdown['ADMIN'] ?? 1}</div>
            <p className="text-xs text-purple-600 mt-1">Full system control</p>
          </div>
          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
            <div className="font-bold text-indigo-900 text-sm">Recruiters</div>
            <div className="text-3xl font-black text-indigo-700 mt-1">{roleBreakdown['RECRUITER'] ?? 0}</div>
            <p className="text-xs text-indigo-600 mt-1">Talent leads & HR</p>
          </div>
          <div className="p-5 rounded-2xl bg-teal-50 border border-teal-100">
            <div className="font-bold text-teal-900 text-sm">Interviewers</div>
            <div className="text-3xl font-black text-teal-700 mt-1">{roleBreakdown['INTERVIEWER'] ?? 0}</div>
            <p className="text-xs text-teal-600 mt-1">Technical evaluators</p>
          </div>
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
            <div className="font-bold text-emerald-900 text-sm">Candidates</div>
            <div className="text-3xl font-black text-emerald-700 mt-1">{roleBreakdown['CANDIDATE'] ?? 0}</div>
            <p className="text-xs text-emerald-600 mt-1">Applicants & test takers</p>
          </div>
        </div>
      </div>

      {/* Master Full Access Quick Action Hub */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Administrator Full-Access Command Hub</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Direct operational access to all recruitment, assessment, interview, and governance subsystems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* User Governance */}
          <Link
            to="/admin/users"
            className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-300 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-purple-700 transition">User Account Governance</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Create, activate, suspend, or delete accounts for Recruiters, Interviewers, and Candidates.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-purple-700">
              <span>Manage Users &rarr;</span>
            </div>
          </Link>

          {/* Job Requisitions */}
          <Link
            to="/recruiter/jobs"
            className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-700 transition">All Job Requisitions</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Review, create, calibrate, and close job postings across all corporate departments.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-700">
              <span>View All Jobs &rarr;</span>
            </div>
          </Link>

          {/* Applications & Resumes */}
          <Link
            to="/recruiter/applications"
            className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-700 transition">Candidate Applications & Resumes</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Inspect AI-parsed resumes, skill coverage matches, and update candidate hiring stages.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-blue-700">
              <span>Review Candidates &rarr;</span>
            </div>
          </Link>

          {/* Live Interview Rooms */}
          <Link
            to="/recruiter/interviews"
            className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-300 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition">WebRTC Video Interview Sessions</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Schedule and monitor live online video rooms, synchronized question pushes, and answer scoring.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-teal-700">
              <span>Monitor Sessions &rarr;</span>
            </div>
          </Link>

          {/* Candidate Rankings */}
          <Link
            to="/recruiter/rankings"
            className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-amber-300 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-700 transition">Rankings & Assessment Reports</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Compare multi-criteria rankings, radar competence charts, and download signed PDF reports.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-amber-700">
              <span>View Rankings &rarr;</span>
            </div>
          </Link>

          {/* Security Audit Logs */}
          <Link
            to="/admin/audit-logs"
            className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition">Security Audit Trails</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Immutable record of logins, status changes, permission changes, and score overrides.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-700">
              <span>Inspect Audit Logs &rarr;</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
