import React, { useState, useEffect } from 'react';
import { interviewsAPI, applicationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Application, Interview } from '../../types';
import {
  Calendar,
  Clock,
  Video,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight
} from 'lucide-react';

export const InterviewSchedulingPage: React.FC = () => {
  const { user, isInterviewer } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviewers, setInterviewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedAppId, setSelectedAppId] = useState('');
  const [title, setTitle] = useState('');
  const [interviewType, setInterviewType] = useState('ONLINE_VIDEO');
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('');
  const [selectedInterviewerId, setSelectedInterviewerId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      if (isInterviewer) {
        // Interviewers only load their assigned interviews
        const intRes = await interviewsAPI.list();
        if (intRes.data?.success) {
          setInterviews(intRes.data.interviews || []);
        }
      } else {
        // Recruiters & Admins load interviews, applications, and interviewer roster
        const [intSettled, appSettled, intvSettled] = await Promise.allSettled([
          interviewsAPI.list(),
          applicationsAPI.list(),
          interviewsAPI.getInterviewers()
        ]);

        if (intSettled.status === 'fulfilled' && intSettled.value.data?.success) {
          setInterviews(intSettled.value.data.interviews || []);
        }

        if (appSettled.status === 'fulfilled' && appSettled.value.data?.success) {
          const apps = appSettled.value.data.applications || [];
          setApplications(apps);
          if (apps.length > 0) {
            setSelectedAppId(apps[0].id);
            setTitle(`${apps[0].job?.title || 'Technical Assessment'} - Video Interview`);
          }
        }

        if (intvSettled.status === 'fulfilled' && intvSettled.value.data?.success) {
          const intvs = intvSettled.value.data.interviewers || intvSettled.value.data.users || [];
          setInterviewers(intvs);
          if (intvs.length > 0) {
            setSelectedInterviewerId(intvs[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load interview scheduling data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Pre-populate time
    const start = new Date(Date.now() + 86400000);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 3600000);
    setScheduledStartTime(start.toISOString().slice(0, 16));
    setScheduledEndTime(end.toISOString().slice(0, 16));
  }, [isInterviewer]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await interviewsAPI.schedule({
        applicationId: selectedAppId,
        title,
        interviewType,
        scheduledStartTime: new Date(scheduledStartTime).toISOString(),
        scheduledEndTime: new Date(scheduledEndTime).toISOString(),
        interviewerIds: selectedInterviewerId ? [selectedInterviewerId] : [],
        meetingNotes: notes
      });

      if (res.data.success) {
        setSuccess(true);
        loadData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule interview.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {isInterviewer ? 'Live Video Interview Rooms' : 'Interview Scheduling & Rooms'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isInterviewer
            ? 'Access your assigned candidate video sessions, conduct real-time evaluations, and apply 5-metric AI rubrics'
            : 'Book WebRTC video interview sessions, assign technical evaluators, and generate secure room links'}
        </p>
      </div>

      {/* Schedule Form - ONLY for Recruiters and Admins (Strictly hidden for Interviewers) */}
      {!isInterviewer && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h3 className="font-extrabold text-base text-slate-900 mb-4 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
            <span>Schedule New Video Assessment</span>
          </h3>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Interview booked! Invitation dispatched and room code generated.</span>
            </div>
          )}

          <form onSubmit={handleSchedule} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Candidate Application</label>
                <select
                  value={selectedAppId}
                  onChange={e => {
                    setSelectedAppId(e.target.value);
                    const found = applications.find(a => a.id === e.target.value);
                    if (found?.job?.title) setTitle(`${found.job.title} - Video Interview`);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                >
                  {applications.length === 0 ? (
                    <option value="">No pending candidate applications found</option>
                  ) : (
                    applications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.candidate?.user?.name || 'Applicant'} &mdash; {app.job?.title || 'Role'} ({app.job?.companyName || 'Enterprise'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Technical Interviewer</label>
                <select
                  value={selectedInterviewerId}
                  onChange={e => setSelectedInterviewerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                >
                  {interviewers.length === 0 ? (
                    <option value="">Loading active technical interviewers...</option>
                  ) : (
                    interviewers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} &mdash; {u.interviewerProfile?.technicalDomain || 'Technical Lead'} ({u.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Interview Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledStartTime}
                  onChange={e => setScheduledStartTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledEndTime}
                  onChange={e => setScheduledEndTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center space-x-2 disabled:opacity-60"
            >
              <Video className="w-4 h-4" />
              <span>{saving ? 'Creating Room & Invitation...' : 'Confirm Schedule & Generate Room'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Scheduled Interviews List */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900">
          {isInterviewer ? 'Your Assigned Interview Sessions' : 'Current Scheduled Sessions'} ({interviews.length})
        </h3>

        {interviews.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-xs text-slate-400">
            {isInterviewer
              ? 'No interview sessions currently assigned to your account. Recruiters will assign you to upcoming candidate rounds.'
              : 'No scheduled interviews found.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviews.map(inv => (
              <div key={inv.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        inv.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}
                    >
                      {inv.status}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{inv.roomCode}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">{inv.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Candidate: <strong className="text-slate-700">{inv.application?.candidate?.user?.name || 'Assigned Candidate'}</strong>
                    {inv.application?.job?.companyName && (
                      <span className="text-slate-400"> &bull; {inv.application.job.companyName}</span>
                    )}
                  </p>

                  <div className="mt-3 text-xs text-slate-600 flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {new Date(inv.scheduledStartTime).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {new Date(inv.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Role: {inv.application?.job?.title || 'Technical Round'}
                  </span>
                  {inv.status === 'COMPLETED' || Date.now() > new Date(inv.scheduledEndTime).getTime() ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Concluded</span>
                    </span>
                  ) : (
                    <a
                      href={`/interview/${inv.roomCode}`}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5 mr-1" />
                      <span>Enter Room</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
