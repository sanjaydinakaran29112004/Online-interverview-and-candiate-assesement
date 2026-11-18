import React, { useState, useEffect } from 'react';
import { resumeAPI, jobsAPI } from '../../services/api';
import { Job } from '../../types';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Cpu,
  GraduationCap,
  Briefcase,
  Award,
  Sparkles,
  ServerOff,
  Check
} from 'lucide-react';

export const ResumeUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await jobsAPI.list();
        if (res.data?.success) {
          setJobs(res.data.jobs || []);
          if (res.data.jobs?.length > 0) {
            setSelectedJobId(res.data.jobs[0].id);
          }
          setBackendOffline(false);
        }
      } catch (err: any) {
        console.warn('Backend server unreachable on port 5000:', err.message);
        setBackendOffline(true);
      }
    };
    fetchJobs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !rawText.trim()) {
      setError('Please provide a resume file (PDF, DOCX) or paste resume text to analyze.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    if (file) formData.append('resume', file);
    if (rawText) formData.append('rawText', rawText);
    if (selectedJobId) formData.append('jobId', selectedJobId);

    try {
      const res = await resumeAPI.uploadAndAnalyze(formData);
      if (res.data.success) {
        setResult(res.data);
        setBackendOffline(false);
      } else {
        setError(res.data.message || 'Resume analysis failed.');
      }
    } catch (err: any) {
      console.error('Resume upload error:', err);
      if (!err.response) {
        setError(
          'Network Connection Error: Cannot connect to the Node.js backend server (http://localhost:5000). Please make sure your backend is running (`npm run dev` in the backend folder).'
        );
      } else {
        setError(err.response?.data?.message || err.message || 'Resume analysis failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          AI Resume Analysis & Skill Extraction
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Extract competencies, evaluate job compatibility, and uncover skill gaps using natural language processing
        </p>
      </div>

      {backendOffline && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start space-x-3">
          <ServerOff className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold">Backend Server Offline Notice:</span> Cannot connect to Node.js backend on{' '}
            <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">http://localhost:5000</code>.
            Please ensure you have started the backend by running <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">npm run dev</code> in your backend terminal.
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        <form onSubmit={handleUpload} className="space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Job Selection for Match */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-800">
              Select Job to Benchmark Compatibility Against
            </label>
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-800 shadow-sm"
            >
              <option value="">-- General Skill & Experience Extraction (No Specific Job) --</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} &mdash; {j.companyName} ({j.location})
                </option>
              ))}
            </select>
            {jobs.length === 0 && !backendOffline && (
              <p className="text-xs text-slate-400">Loading open job requisitions...</p>
            )}
          </div>

          {/* File Upload Box */}
          <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:border-indigo-400 transition bg-slate-50/50">
            <UploadCloud className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
            <h4 className="font-bold text-sm text-slate-800">Upload Resume Document</h4>
            <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, and TXT files (Max 10MB)</p>

            <input
              type="file"
              id="resume-file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label
              htmlFor="resume-file"
              className="mt-4 inline-flex items-center space-x-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-bold border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition"
            >
              {file ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{file.name}</span>
                </>
              ) : (
                <span>Choose Resume File</span>
              )}
            </label>
          </div>

          <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">&mdash; or paste plain resume text &mdash;</div>

          <div>
            <textarea
              rows={4}
              placeholder="Paste raw resume text here (Summary, skills, experience, education)..."
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition flex items-center justify-center space-x-2 shadow-md shadow-indigo-100 disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Analyzing with AI NLP Service...' : 'Extract Skills & Calculate Compatibility'}</span>
          </button>
        </form>
      </div>

      {/* Analysis Output Presentation */}
      {result && (
        <div className="space-y-5 animate-in fade-in">
          {/* Compatibility Score Banner if Job Selected */}
          {result.analysis && (
            <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 rounded-3xl p-7 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-bold px-3 py-1 bg-white/20 rounded-full uppercase tracking-wider">
                    AI Job Fit Analysis
                  </span>
                  <h3 className="text-2xl font-extrabold mt-3">
                    Compatibility Score: {result.analysis.compatibilityScore}%
                  </h3>
                  <p className="text-sm text-indigo-100 mt-2 max-w-2xl leading-relaxed">
                    {result.analysis.scoreExplanation}
                  </p>
                </div>
                <div className="p-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md text-center shrink-0">
                  <div className="text-3xl font-black">{result.analysis.compatibilityScore}%</div>
                  <span className="text-xs text-indigo-200 uppercase font-semibold">Match Metric</span>
                </div>
              </div>
            </div>
          )}

          {/* Structured Extraction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm mb-3">
                <Briefcase className="w-5 h-5" />
                <span>Experience Identified</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {result.parsedData?.experience_years ?? 0} yrs
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Calculated from chronological experience entries</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm mb-3">
                <GraduationCap className="w-5 h-5" />
                <span>Education Background</span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {result.parsedData?.education?.length > 0
                  ? result.parsedData.education.join(', ')
                  : 'Degree Identified'}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Verified academic qualifications</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm mb-3">
                <Award className="w-5 h-5" />
                <span>Certifications</span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {result.parsedData?.certifications?.length > 0
                  ? result.parsedData.certifications.join(', ')
                  : 'Verified or Standard'}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Professional engineering certs</p>
            </div>
          </div>

          {/* Skill Breakdown Grid */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center">
              <Cpu className="w-5 h-5 mr-2.5 text-indigo-600" />
              <span>Extracted Technical Competency Taxonomy</span>
            </h3>

            <div className="flex flex-wrap gap-2.5">
              {result.parsedData?.skills?.all_skills?.map((sk: string) => (
                <span
                  key={sk}
                  className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs sm:text-sm font-semibold rounded-xl"
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
