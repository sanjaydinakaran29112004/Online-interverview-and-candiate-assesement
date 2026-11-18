import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interviewsAPI } from '../../services/api';
import { Interview } from '../../types';
import { Video, Calendar, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export const CandidateInterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await interviewsAPI.list();
        if (res.data.success) {
          setInterviews(res.data.interviews || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Interview Schedule</h1>
        <p className="text-xs text-slate-500 mt-1">Manage scheduled WebRTC video assessments and access interview rooms</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading interview schedules...</div>
      ) : interviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
          <Video className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-700">No scheduled interviews</h3>
          <p className="text-xs text-slate-400 mt-1">When recruiters schedule an interview, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map(inv => {
            const isCompleted = inv.status === 'COMPLETED';
            return (
              <div
                key={inv.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isCompleted ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {inv.status}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{inv.roomCode}</span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900">{inv.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {inv.application?.job?.companyName || 'Technical Interview'}
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                      <span>{new Date(inv.scheduledStartTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                      <span>
                        {new Date(inv.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(inv.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-400" /> Peer-to-Peer WebRTC
                  </span>

                  <Link
                    to={`/interview/${inv.roomCode}`}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center shadow-sm ${
                      isCompleted
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 mr-1.5" />
                    <span>{isCompleted ? 'Review Session' : 'Enter Interview Room'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
