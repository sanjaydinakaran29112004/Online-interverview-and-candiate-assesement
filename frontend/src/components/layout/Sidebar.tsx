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

  const interviewerLinks = [
    { to: '/recruiter/dashboard', label: 'Interviewer Console', icon: LayoutDashboard },
    { to: '/recruiter/interviews', label: 'Live Interview Rooms', icon: Video },
    { to: '/recruiter/questions', label: 'AI Question Bank', icon: HelpCircle }
  ];

  // Administrator has Full Operational Command Hub access directly from the Sidebar:
  const adminLinks = [
    { to: '/admin/dashboard', label: 'System Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Account Governance', icon: Users },
    { to: '/recruiter/jobs', label: 'All Job Requisitions', icon: Briefcase },
    { to: '/recruiter/applications', label: 'Candidate Applications & Resumes', icon: Layers },
    { to: '/recruiter/interviews', label: 'WebRTC Video Interview Sessions', icon: Video },
    { to: '/recruiter/rankings', label: 'Rankings & Assessment Reports', icon: Award },
    { to: '/recruiter/analytics', label: 'Recruitment Analytics', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Security Audit Trails', icon: ShieldCheck },
    { to: '/admin/ai-settings', label: 'AI Rubric Config', icon: Cpu },
    { to: '/research/experiments', label: 'IEEE Research Suite', icon: FlaskConical }
  ];

  const links = isAdmin
    ? adminLinks
    : isRecruiter
    ? recruiterLinks
    : isInterviewer
    ? interviewerLinks
    : candidateLinks;

  if (!user) {
    return null;
  }

  return (
    <aside className="w-64 lg:w-72 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 sm:p-5 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-8rem)] pr-1">
        <div className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          {isAdmin
            ? 'Master Administration'
            : isRecruiter
            ? 'Recruitment Console'
            : isInterviewer
            ? 'Interviewer Workspace'
            : 'Candidate Workspace'}
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

      <div className="pt-4 border-t border-slate-100">
        <div className="px-3.5 py-2 text-[11px] font-semibold text-slate-400">
          Role-Based Secure Portal
        </div>
      </div>
    </aside>
  );
};
