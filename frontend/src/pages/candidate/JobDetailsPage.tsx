import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI, applicationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Send,
  AlertCircle
} from 'lucide-react';

export const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      try {
        const res = await jobsAPI.get(id);
        if (res.data.success) {
          setJob(res.data.job);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

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
                <DollarSign className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
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

      {/* Application Submission Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-base text-slate-900 mb-2">Submit Your Application</h3>
        <p className="text-xs text-slate-500 mb-4">
          Your profile and current resume will be analyzed by our NLP assessment engine to match against this position.
        </p>

        {applied ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
