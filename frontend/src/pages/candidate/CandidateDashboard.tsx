import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';

export const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
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
        if (appRes.data.success) setApplications(appRes.data.applications || []);
        if (intRes.data.success) setInterviews(intRes.data.interviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const upcomingInterviews = interviews.filter(i => i.status === 'SCHEDULED' || i.status === 'CONFIRMED');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-brand-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Candidate Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-indigo-100">
            Track your job applications, join live WebRTC interview rooms, and inspect your AI-evaluated skill competency reports.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/jobs"
              className="px-5 py-2.5 bg-white text-indigo-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition shadow-sm"
            >
              Explore Job Openings &rarr;
            </Link>
            <Link
              to="/candidate/resume"
              className="px-5 py-2.5 bg-indigo-700/80 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition border border-indigo-500"
            >
              Analyze My Resume
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applications</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{applications.length}</div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Total job submissions</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Interviews</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">{upcomingInterviews.length}</div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Live WebRTC sessions</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shortlisted</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">
            {applications.filter(a => a.status === 'SHORTLISTED' || a.status === 'COMPLETED').length}
          </div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Advanced recruitment stages</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Tests</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-3">
            {interviews.filter(i => i.status === 'COMPLETED').length}
          </div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Finalized assessments</span>
        </div>
      </div>

      {/* Upcoming Interview Banner if any */}
      {upcomingInterviews.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-indigo-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider">
                Next Scheduled Session
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-2.5">
                {upcomingInterviews[0].title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1.5">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-indigo-500" />
                  {new Date(upcomingInterviews[0].scheduledStartTime).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-indigo-500" />
                  {new Date(upcomingInterviews[0].scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <Link
              to={`/interview/${upcomingInterviews[0].roomCode}`}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition flex items-center shadow-md shadow-indigo-100 shrink-0"
            >
              <Video className="w-4 h-4 mr-2" /> Join Video Room
            </Link>
          </div>
        </div>
      )}

      {/* Recent Applications List */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base text-slate-900">Recent Applications</h3>
          <Link to="/candidate/applications" className="text-sm text-indigo-600 font-semibold hover:underline">
            View All ({applications.length})
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">
            No applications submitted yet. Browse open jobs to apply!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.slice(0, 4).map(app => (
              <div key={app.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{app.job?.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{app.job?.companyName} &bull; {app.job?.location}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    {app.status}
                  </span>
                  <Link
                    to={`/jobs/${app.jobId}`}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
