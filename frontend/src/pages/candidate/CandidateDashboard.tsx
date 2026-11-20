import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { applicationsAPI, interviewsAPI } from '../../services/api';
import { Application, Interview } from '../../types';
import {
  Briefcase,
  Video,
  FileCheck,
  Award,
  ArrowRight,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [appRes, intRes] = await Promise.all([
          applicationsAPI.list(),
          interviewsAPI.list()
        ]);

        const apps: Application[] = appRes.data.success ? (appRes.data.applications || []) : [];
        const directInterviews: Interview[] = intRes.data.success ? (intRes.data.interviews || []) : [];

        // Aggregate interviews from both direct list and application relations
        const appInterviews: Interview[] = apps.flatMap(a => (a.interviews || []) as Interview[]);
        const interviewMap = new Map<string, Interview>();

        directInterviews.forEach(i => interviewMap.set(i.id, i));
        appInterviews.forEach(i => {
          if (!interviewMap.has(i.id)) {
            interviewMap.set(i.id, i);
          }
        });

        const mergedInterviews = Array.from(interviewMap.values()).sort(
          (a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
        );

        setApplications(apps);
        setInterviews(mergedInterviews);
      } catch (err) {
        console.error('Failed to load candidate dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter active, non-completed upcoming interviews
  const rawUpcoming = interviews.filter(
    i => i.status !== 'COMPLETED' && i.status !== 'CANCELLED'
  );

  // Deduplicate by applicationId so only the single latest active session is displayed per opening
  const upcomingInterviews = Array.from(
    rawUpcoming.reduce((map, item) => {
      const key = item.applicationId || item.id;
      const existing = map.get(key);
      if (!existing || new Date(item.scheduledStartTime).getTime() > new Date(existing.scheduledStartTime).getTime()) {
        map.set(key, item);
      }
      return map;
    }, new Map<string, Interview>()).values()
  );

  const handleJoinRoom = (inv: Interview) => {
    const isCompleted = inv.status === 'COMPLETED';

    if (isCompleted) {
      alert(
        `Interview Session Concluded!\n\n` +
        `This interview session has ended and the room is closed.\n\n` +
        `Your evaluation report and feedback are available on your Assessment Reports page.`
      );
      navigate('/candidate/assessments');
      return;
    }

    navigate(`/interview/${inv.roomCode}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden border border-indigo-700/40">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Candidate Assessment Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Candidate'}!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
            Track your recruitment stages, join live WebRTC interview rooms, and inspect your AI competency rubrics.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/jobs"
              className="px-5 py-2.5 bg-white text-indigo-900 rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-50 transition shadow-sm flex items-center space-x-1.5"
            >
              <span>Explore Openings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/candidate/resume"
              className="px-5 py-2.5 bg-indigo-700/80 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm transition border border-indigo-400/40"
            >
              Analyze My Resume
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Applications
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">{applications.length}</div>
          <span className="text-xs text-slate-400 font-medium mt-1 inline-block">
            Submitted requisitions
          </span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Upcoming Interviews
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-3">{upcomingInterviews.length}</div>
          <span className="text-xs text-slate-400 font-medium mt-1 inline-block">
            Live WebRTC sessions
          </span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Shortlisted
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-3">
            {applications.filter(a => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW_SCHEDULED' || a.status === 'COMPLETED').length}
          </div>
          <span className="text-xs text-slate-400 font-medium mt-1 inline-block">
            Active candidate pipeline
          </span>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Evaluated Tests
            </span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-3">
            {interviews.filter(i => i.status === 'COMPLETED').length}
          </div>
          <span className="text-xs text-slate-400 font-medium mt-1 inline-block">
            Finalized assessments
          </span>
        </div>
      </div>

      {/* Scheduled Live Video Assessments Section */}
      {upcomingInterviews.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-indigo-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-50">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                <Video className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Active Scheduled Video Assessments ({upcomingInterviews.length})
              </h2>
            </div>
            <Link
              to="/candidate/interviews"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingInterviews.map(inv => {
              const jobTitle = inv.application?.job?.title || inv.title;
              const company = inv.application?.job?.companyName || 'Technical Interview Session';

              return (
                <div
                  key={inv.id}
                  className="p-5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                        {inv.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {inv.roomCode}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{jobTitle}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{company}</p>

                    <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200/60 space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center font-medium">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-indigo-600 shrink-0" />
                        <span>{new Date(inv.scheduledStartTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center font-medium">
                        <Clock className="w-3.5 h-3.5 mr-2 text-indigo-600 shrink-0" />
                        <span>
                          {new Date(inv.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(inv.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-400 flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Encrypted P2P
                    </span>
                    <button
                      onClick={() => handleJoinRoom(inv)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Room</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Applications Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Applications</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live updates on your candidate hiring stages and interview invites
            </p>
          </div>
          <Link
            to="/candidate/applications"
            className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1"
          >
            <span>View All ({applications.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-10 text-xs sm:text-sm text-slate-400">
            No applications submitted yet. Browse open jobs to apply!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.slice(0, 5).map(app => {
              const appInterviews = (app.interviews || []) as Interview[];
              const hasInterview = appInterviews.length > 0;
              const activeInv = appInterviews[0];

              return (
                <div key={app.id} className="py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        app.status === 'OFFERED' || app.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold'
                          : app.status === 'ASSESSMENT_COMPLETED' || app.status === 'COMPLETED'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : app.status === 'IN_PROGRESS'
                          ? 'bg-teal-100 text-teal-800 border-teal-200'
                          : app.status === 'INTERVIEW_SCHEDULED'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          : app.status === 'SHORTLISTED'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {app.status === 'OFFERED' || app.status === 'ACCEPTED'
                          ? '✓ Accepted & Job Offered'
                          : app.status === 'ASSESSMENT_COMPLETED' || app.status === 'COMPLETED'
                          ? 'Assessment Completed • Pending Decision'
                          : app.status === 'SHORTLISTED'
                          ? 'Shortlisted • Awaiting Schedule'
                          : app.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Applied: {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900">{app.job?.title}</h3>
                    <p className="text-xs text-slate-500">
                      {app.job?.companyName} &bull; {app.job?.location}
                    </p>

                    {hasInterview && activeInv && (
                      <div className="mt-1 inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-semibold">
                        <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>
                          Interview: {new Date(activeInv.scheduledStartTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                    {hasInterview && activeInv && (
                      activeInv.status === 'COMPLETED' || Date.now() > new Date(activeInv.scheduledEndTime).getTime() ? (
                        <Link
                          to="/candidate/assessments"
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                        >
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Report</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleJoinRoom(activeInv)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Room</span>
                        </button>
                      )
                    )}
                    <Link
                      to={`/jobs/${app.jobId}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    >
                      <span>Job Spec</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
