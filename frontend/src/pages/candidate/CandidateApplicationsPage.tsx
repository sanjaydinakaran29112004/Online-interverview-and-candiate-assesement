import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI } from '../../services/api';
import { Application } from '../../types';
import { Layers, Briefcase, Calendar, CheckCircle2, Clock, Video, ArrowRight } from 'lucide-react';

export const CandidateApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

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
      case 'SHORTLISTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Applications</h1>
        <p className="text-xs text-slate-500 mt-1">Track recruitment progress, status updates, and compatibility feedback</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading your applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-700">No applications found</h3>
          <p className="text-xs text-slate-400 mt-1">You haven't submitted any job applications yet.</p>
          <Link to="/jobs" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
            Browse Job Requisitions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => {
            const analysis = app.resumeAnalyses?.[0];
            return (
              <div key={app.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(app.status)}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Applied: {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">{app.job?.title}</h3>
                  <p className="text-xs text-slate-600 font-medium">{app.job?.companyName} &bull; {app.job?.location}</p>

                  {analysis && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>AI Compatibility Rating</span>
                        <span className="text-indigo-600">{analysis.compatibilityScore}%</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        {analysis.scoreExplanation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between items-start md:items-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="text-xs text-slate-500 mb-4">
                    {app.interviews && app.interviews.length > 0 && (
                      <div className="flex items-center text-indigo-700 font-semibold bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
                        <Video className="w-3.5 h-3.5 mr-1.5" />
                        <span>Interview Scheduled</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 w-full md:w-auto">
                    {app.interviews?.[0]?.roomCode && (
                      <Link
                        to={`/interview/${app.interviews[0].roomCode}`}
                        className="flex-1 md:flex-initial px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center space-x-1 shadow-sm"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Room</span>
                      </Link>
                    )}
                    <Link
                      to={`/jobs/${app.jobId}`}
                      className="flex-1 md:flex-initial px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center"
                    >
                      <span>Job Spec</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
