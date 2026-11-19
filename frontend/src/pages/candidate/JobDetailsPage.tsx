import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsAPI, applicationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';
import {
  MapPin,
  Briefcase,
  IndianRupee,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertCircle
} from 'lucide-react';

export const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [existingApp, setExistingApp] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobAndApplication = async () => {
      if (!id) return;
      try {
        const [jobRes, appsRes] = await Promise.allSettled([
          jobsAPI.get(id),
          user?.role === 'CANDIDATE' ? applicationsAPI.list() : Promise.resolve({ data: { applications: [] } })
        ]);

        if (jobRes.status === 'fulfilled' && jobRes.value.data?.success) {
          setJob(jobRes.value.data.job);
        }

        if (appsRes.status === 'fulfilled' && (appsRes.value as any)?.data?.success) {
          const apps = (appsRes.value as any)?.data?.applications || [];
          const found = apps.find((a: any) => a.jobId === id || a.job?.id === id);
          if (found) {
            setExistingApp(found);
            setApplied(true);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchJobAndApplication();
  }, [id, user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setApplying(true);
    setError(null);
    try {
      const res = await applicationsAPI.apply({
        jobId: id,
        coverLetter
      });
      if (res.data.success) {
        setApplied(true);
        setExistingApp(res.data.application);
        setMessage('Application successfully submitted! You will receive interview updates.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-400">Loading vacancy details...</div>;
  }

  if (!job) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
        <h3 className="font-bold text-sm text-slate-800">Job Not Found</h3>
        <button onClick={() => navigate('/jobs')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Return to Job Listings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/jobs')}
        className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to listings
      </button>

      {/* Main Job Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 uppercase">
              {job.employmentType.replace('_', ' ')}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{job.title}</h1>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">{job.companyName}</p>
          </div>

          <div className="flex flex-col items-start sm:items-end text-xs text-slate-500 space-y-1">
            <span className="flex items-center font-medium">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {job.location}
            </span>
            {job.salaryRange && (
              <span className="flex items-center font-bold text-slate-800">
                <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-slate-500" />
                {job.salaryRange}
              </span>
            )}
          </div>
        </div>

        {/* Required Skills Matrix */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Competency & Skill Requirements
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {job.skills?.map(sk => (
              <div key={sk.skillName} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-xs text-slate-800">{sk.skillName}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Proficiency: <span className="font-semibold text-indigo-600">{sk.minimumProficiency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description Body */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Role Description & Responsibilities
          </h3>
          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {job.description}
          </div>
        </div>
      </div>

      {/* Application Submission OR Existing Application Status */}
      {existingApp ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Application Already Submitted</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Applied on {new Date(existingApp.appliedAt || Date.now()).toLocaleDateString(undefined, { dateStyle: 'medium' })} &bull; Application Ref: <span className="font-mono">{existingApp.id?.slice(0, 8)}</span>
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
              {existingApp.status?.replace('_', ' ') || 'APPLIED'}
            </span>
          </div>

          {/* If an interview is scheduled for this candidate on this job */}
          {existingApp.interviews && existingApp.interviews.length > 0 ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-slate-50 border border-teal-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-teal-900">
                  <Video className="w-4 h-4 text-teal-600" />
                  <span>Assigned Live Video Interview: {existingApp.interviews[0].title}</span>
                </div>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-100/70 px-2.5 py-0.5 rounded-full">
                  {existingApp.interviews[0].status}
                </span>
              </div>
              <div className="flex items-center text-xs text-slate-600 space-x-4">
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {new Date(existingApp.interviews[0].scheduledStartTime).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {new Date(existingApp.interviews[0].scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to={`/interview/${existingApp.interviews[0].roomCode}`}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Enter Video Room</span>
                </Link>
                <Link
                  to="/candidate/interviews"
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                >
                  <span>View All Scheduled Sessions</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-600">
                Your application has been received and is currently under technical review. You will be notified when an interview round is assigned.
              </span>
              <Link
                to="/candidate/applications"
                className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 shrink-0"
              >
                <span>Track My Applications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      ) : user?.role !== 'CANDIDATE' && user ? (
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 text-center text-xs text-slate-500">
          Job requisition preview mode. Candidates can apply for this position from the candidate portal.
        </div>
      ) : (
        /* Only show submission form if candidate has NOT applied yet */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h3 className="font-extrabold text-base text-slate-900 mb-2">Submit Your Application</h3>
          <p className="text-xs text-slate-500 mb-4">
            Your profile and current resume will be analyzed by our NLP assessment engine to match against this position.
          </p>

          <form onSubmit={handleApply} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cover Note / Why are you a great fit? (Optional)
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder="Share relevant projects, architectural experience, or certifications..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={applying}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition flex items-center space-x-2 shadow-md shadow-indigo-100 disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{applying ? 'Submitting Application...' : 'Confirm & Submit Application'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
