import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { interviewsAPI } from '../../services/api';
import { Interview } from '../../types';
import { Video, Calendar, Clock, ArrowRight, ShieldCheck, CheckCircle2, Award } from 'lucide-react';

export const CandidateInterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleEnterRoom = (inv: Interview) => {
    const isCompleted = inv.status === 'COMPLETED';
    const now = Date.now();
    const startTime = new Date(inv.scheduledStartTime).getTime();
    const endTime = new Date(inv.scheduledEndTime).getTime();
    const allowedTime = startTime - (5 * 60 * 1000);

    if (isCompleted || now > endTime) {
      alert('This interview session has already ended and concluded. The video room is closed.');
      return;
    }

    if (now < allowedTime) {
      const minsLeft = Math.max(1, Math.ceil((allowedTime - now) / 60000));
      alert(
        `Session Opens 5 Minutes Prior to Scheduled Start!\n\n` +
        `Scheduled Start: ${new Date(inv.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
        `Room Window Opens In: Approximately ${minsLeft} minute(s).\n\n` +
        `Taking you to the Waiting Room with live countdown timer and preparation guidelines.`
      );
    }

    navigate(`/interview/${inv.roomCode}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Video Interview Schedules
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Access your WebRTC video assessment rooms, synchronized coding questions, and evaluation records
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400 font-semibold flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading interview schedules...</span>
        </div>
      ) : interviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <Video className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-base text-slate-800">No scheduled interviews</h3>
          <p className="text-xs text-slate-400 mt-1">
            When recruiters schedule an assessment for your application, it will appear here immediately.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {interviews.map(inv => {
            const isCompleted = inv.status === 'COMPLETED';

            return (
              <div
                key={inv.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isCompleted
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200 font-extrabold'
                      }`}
                    >
                      {inv.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                      {inv.roomCode}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{inv.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {inv.application?.job?.companyName || 'Technical Interview Session'}
                  </p>

                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-700 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 font-medium">
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-2 text-indigo-600 shrink-0" />
                      <span>{new Date(inv.scheduledStartTime).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-2 text-indigo-600 shrink-0" />
                      <span>
                        {new Date(inv.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(inv.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    WebRTC P2P
                  </span>

                  {isCompleted ? (
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Session Concluded</span>
                      </span>
                      <Link
                        to="/candidate/assessments"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition border border-indigo-200 flex items-center space-x-1"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Report</span>
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEnterRoom(inv)}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Enter Video Room</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
