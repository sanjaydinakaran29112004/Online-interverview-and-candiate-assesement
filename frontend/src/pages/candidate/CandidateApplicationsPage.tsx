import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../../services/api';
import { Application, Interview } from '../../types';
import { Layers, Calendar, Clock, Video, ArrowRight, ShieldCheck, Sparkles, Award } from 'lucide-react';

export const CandidateApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await applicationsAPI.list();
        if (res.data.success) {
          setApplications(res.data.applications || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SHORTLISTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'RECOMMENDED_HIRE':
      case 'OFFERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-extrabold';
      case 'TECHNICAL_ROUND_2':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleJoinRoom = (inv: Interview) => {
    const isCompleted = inv.status === 'COMPLETED';
    const now = Date.now();
    const startTime = new Date(inv.scheduledStartTime).getTime();
    const endTime = new Date(inv.scheduledEndTime).getTime();
    const allowedTime = startTime - (5 * 60 * 1000);

    if (isCompleted || now > endTime) {
      alert('This interview session has ended and concluded. The video room is closed.\n\nYou can inspect your assessment report on your Assessment Reports page.');
      navigate('/candidate/assessments');
      return;
    }

    if (now < allowedTime) {
      const minsLeft = Math.max(1, Math.ceil((allowedTime - now) / 60000));
      alert(
        `Interview Room Not Open Yet!\n\n` +
        `This session is scheduled for ${new Date(inv.scheduledStartTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.\n\n` +
        `You can enter the video room 5 minutes prior to the scheduled start time (in approximately ${minsLeft} minutes).`
      );
      return;
    }

    navigate(`/interview/${inv.roomCode}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Applications
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track recruitment stages, AI resume match feedback, and live interview rooms
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400 font-semibold flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading your job applications...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-base text-slate-800">No applications submitted yet</h3>
          <p className="text-xs text-slate-400 mt-1">Explore current openings to apply and attend technical assessments.</p>
          <Link
            to="/jobs"
            className="mt-4 inline-flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <span>Browse Job Requisitions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => {
            const analysis = app.resumeAnalyses?.[0];
            const appInterviews = (app.interviews || []) as Interview[];
            const activeInv = appInterviews[0];

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row justify-between gap-5"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(app.status)}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                      Applied: {new Date(app.appliedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{app.job?.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    {app.job?.companyName} &bull; {app.job?.location}
                  </p>

                  {/* Scheduled Interview Box */}
                  {activeInv && (
                    <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center">
                          <Video className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                          Live Assessment Scheduled
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">
                          {activeInv.roomCode}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-700">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-indigo-600" />
                          {new Date(activeInv.scheduledStartTime).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-indigo-600" />
                          {new Date(activeInv.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(activeInv.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* AI Compatibility Analysis */}
                  {analysis && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center">
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                          AI Resume Match Score
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-indigo-600">
                          {analysis.compatibilityScore}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {analysis.scoreExplanation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 gap-3">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Role-Based Access</span>
                  </div>

                  <div className="flex items-center space-x-2 w-full lg:w-auto">
                    {activeInv && (
                      activeInv.status === 'COMPLETED' || Date.now() > new Date(activeInv.scheduledEndTime).getTime() ? (
                        <Link
                          to="/candidate/assessments"
                          className="flex-1 lg:flex-initial px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Report</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleJoinRoom(activeInv)}
                          className="flex-1 lg:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Room</span>
                        </button>
                      )
                    )}
                    <Link
                      to={`/jobs/${app.jobId}`}
                      className="flex-1 lg:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
                    >
                      <span>Job Spec</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
