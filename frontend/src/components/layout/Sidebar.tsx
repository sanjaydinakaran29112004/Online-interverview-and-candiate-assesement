import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Video,
  Award,
  Users,
  BarChart3,
  HelpCircle,
  ShieldCheck,
  Cpu,
  Layers,
  FlaskConical,
  Eye
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, isRecruiter, isInterviewer, isCandidate } = useAuth();

  const candidateLinks = [
    { to: '/candidate/dashboard', label: 'Candidate Dashboard', icon: LayoutDashboard },
    { to: '/jobs', label: 'Explore Openings', icon: Briefcase },
    { to: '/candidate/applications', label: 'My Applications', icon: Layers },
    { to: '/candidate/resume', label: 'Resume & AI Match', icon: FileText },
    { to: '/candidate/interviews', label: 'Video Interviews', icon: Video },
    { to: '/candidate/assessments', label: 'Assessment Reports', icon: Award }
  ];

  const recruiterLinks = [
    { to: '/recruiter/dashboard', label: 'Recruiter Dashboard', icon: LayoutDashboard },
    { to: '/recruiter/jobs', label: 'Job Requisitions', icon: Briefcase },
    { to: '/recruiter/applications', label: 'Review Candidates', icon: Users },
    { to: '/recruiter/questions', label: 'AI Question Bank', icon: HelpCircle },
    { to: '/recruiter/interviews', label: 'Schedule & Rooms', icon: Video },
    { to: '/recruiter/rankings', label: 'Candidate Rankings', icon: Award },
    { to: '/recruiter/analytics', label: 'Recruitment Analytics', icon: BarChart3 }
  ];

  // Administrator has COMPLETE MASTER ACCESS across governance, requisitions, candidates, and AI settings
  const adminLinks = [
    { to: '/admin/dashboard', label: 'System Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Governance', icon: Users },
    { to: '/recruiter/jobs', label: 'All Job Requisitions', icon: Briefcase },
    { to: '/recruiter/applications', label: 'All Applications & Resumes', icon: Layers },
    { to: '/recruiter/questions', label: 'AI Question Bank', icon: HelpCircle },
    { to: '/recruiter/interviews', label: 'Live Interview Rooms', icon: Video },
    { to: '/recruiter/rankings', label: 'Candidate Rankings', icon: Award },
    { to: '/recruiter/analytics', label: 'Platform Analytics', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Security Audit Logs', icon: ShieldCheck },
    { to: '/admin/ai-settings', label: 'AI Rubric Config', icon: Cpu },
    { to: '/candidate/dashboard', label: 'Candidate Experience View', icon: Eye }
  ];

  const links = isAdmin
    ? adminLinks
    : isRecruiter || isInterviewer
    ? recruiterLinks
    : candidateLinks;

  if (!user) {
    return null;
  }

  return (
    <aside className="w-64 lg:w-72 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 sm:p-5 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
        <div className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          {isAdmin ? 'Master Administration' : isRecruiter ? 'Recruitment Console' : 'Candidate Workspace'}
        </div>
        {links.map(link => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center space-x-3.5 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm border border-indigo-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-2">
        <NavLink
          to="/research/experiments"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? 'bg-purple-50 text-purple-700 font-semibold border border-purple-200'
                : 'text-slate-600 hover:bg-purple-50/70 hover:text-purple-700'
            }`
          }
        >
          <FlaskConical className="w-5 h-5 text-purple-600 shrink-0" />
          <span>IEEE Research Suite</span>
        </NavLink>
      </div>
    </aside>
  );
};
