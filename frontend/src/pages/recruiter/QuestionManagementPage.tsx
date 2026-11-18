import React, { useState, useEffect } from 'react';
import { questionsAPI, jobsAPI } from '../../services/api';
import { Job, InterviewQuestion } from '../../types';
import {
  HelpCircle,
  Sparkles,
  Save,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const QuestionManagementPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Generation options
  const [jobTitle, setJobTitle] = useState('Senior Full Stack Engineer');
  const [category, setCategory] = useState('TECHNICAL');
  const [experienceLevel, setExperienceLevel] = useState('INTERMEDIATE');
  const [skills, setSkills] = useState('React, Node.js, SQL');
  const [numQuestions, setNumQuestions] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await jobsAPI.list();
        if (res.data.success && res.data.jobs?.length > 0) {
          setJobs(res.data.jobs);
          setSelectedJob(res.data.jobs[0]);
          setJobTitle(res.data.jobs[0].title);
          setSkills(res.data.jobs[0].skills?.map((s: any) => s.skillName).join(', ') || 'React, Node.js');
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchJobs();
  }, []);

  const handleJobSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = jobs.find(j => j.id === e.target.value);
    if (found) {
      setSelectedJob(found);
      setJobTitle(found.title);
      setSkills(found.skills?.map(s => s.skillName).join(', ') || 'React, Node.js');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setSavedSuccess(false);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await questionsAPI.generate({
        jobTitle,
        jobDescription: selectedJob?.description || 'Software Engineering Role',
        requiredSkills: skillsArray,
        experienceLevel: experienceLevel.toLowerCase(),
        category: category.toLowerCase(),
        numQuestions,
        saveAsSet: true,
        jobId: selectedJob?.id
      });

      if (res.data.success) {
        setGeneratedQuestions(res.data.questions || []);
        setSavedSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Interview Question Engine</h1>
        <p className="text-xs text-slate-500 mt-1">
          Synthesize calibrated interview questions with expected concepts, rubrics, and time limits dynamically
        </p>
      </div>

      {/* Generator Configuration Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <form onSubmit={handleGenerate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Requisition</label>
              <select
                onChange={handleJobSelect}
                value={selectedJob?.id || ''}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
              >
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.companyName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Interview Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
              >
                <option value="TECHNICAL">Technical Architecture</option>
                <option value="PROGRAMMING">Programming & Data Structures</option>
                <option value="BEHAVIORAL">Behavioral & Incident Post-Mortem</option>
                <option value="HR">HR & Cultural Alignment</option>
                <option value="SITUATIONAL">Situational Case Study</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Difficulty Level</label>
              <select
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
              >
                <option value="BEGINNER">Beginner (Junior)</option>
                <option value="INTERMEDIATE">Intermediate (Mid-Level)</option>
                <option value="ADVANCED">Advanced (Senior)</option>
                <option value="EXPERT">Expert (Staff/Principal)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Question Count</label>
              <select
                value={numQuestions}
                onChange={e => setNumQuestions(parseInt(e.target.value, 10))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
              >
                <option value={3}>3 Questions</option>
                <option value={4}>4 Questions</option>
                <option value={5}>5 Questions</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Skills to Assess</label>
            <input
              type="text"
              value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder="e.g. React, Node.js, SQL, Docker"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedSuccess && (
              <span className="text-emerald-700 font-bold flex items-center text-xs">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                Questions generated & saved to question bank!
              </span>
            )}
            <button
              type="submit"
              disabled={generating}
              className="ml-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center space-x-1.5 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? 'Synthesizing with NLP...' : 'Generate Calibrated Questions'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Generated Questions View */}
      {generatedQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">
            Generated Questions ({generatedQuestions.length})
          </h3>

          {generatedQuestions.map((q, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {q.skill_evaluated}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {q.difficulty}
                  </span>
                </div>
                <span className="text-xs text-slate-400 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {q.time_limit_seconds}s limit
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900">{q.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{q.description}</p>

              {/* Expected Concepts Rubric */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Expected Conceptual Anchors:
                </span>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                  {q.expected_concepts?.map((concept: string, cIdx: number) => (
                    <li key={cIdx}>{concept}</li>
                  ))}
                </ul>
              </div>

              <div className="text-[11px] text-slate-500 italic">
                <span className="font-semibold text-slate-700 not-italic">Scoring Rubric: </span>
                {q.evaluation_criteria}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
