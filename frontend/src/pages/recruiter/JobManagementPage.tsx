import React, { useState, useEffect } from 'react';
import { jobsAPI } from '../../services/api';
import { Job } from '../../types';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit,
  MapPin,
  DollarSign,
  Users,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';

export const JobManagementPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State (Clean empty states - user enters their own details)
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [salaryRange, setSalaryRange] = useState('');
  const [minExperience, setMinExperience] = useState('0');
  const [maxExperience, setMaxExperience] = useState('10');
  const [minProficiency, setMinProficiency] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('INTERMEDIATE');
  const [skillsList, setSkillsList] = useState<{ skillName: string; minimumProficiency: string }[]>([
    { skillName: 'React', minimumProficiency: 'INTERMEDIATE' },
    { skillName: 'Node.js', minimumProficiency: 'INTERMEDIATE' },
    { skillName: 'TypeScript', minimumProficiency: 'INTERMEDIATE' }
  ]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('INTERMEDIATE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await jobsAPI.list();
      if (res.data.success) {
        setJobs(res.data.jobs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const trimmed = newSkillInput.trim();
    if (!skillsList.some(s => s.skillName.toLowerCase() === trimmed.toLowerCase())) {
      setSkillsList(prev => [...prev, { skillName: trimmed, minimumProficiency: newSkillLevel }]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkillsList(prev => prev.filter(s => s.skillName !== skillName));
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (skillsList.length === 0) {
      setError('Please add at least one required skill with its expected proficiency level.');
      return;
    }
    setSaving(true);
    setError(null);

    const skillsArray = skillsList.map(s => ({
      skillName: s.skillName,
      weight: 1.0,
      isRequired: true,
      minimumProficiency: s.minimumProficiency
    }));

    try {
      const res = await jobsAPI.create({
        title,
        companyName,
        description,
        location,
        employmentType,
        salaryRange,
        minExperience: parseFloat(minExperience),
        maxExperience: parseFloat(maxExperience),
        skills: skillsArray
      });

      if (res.data.success) {
        setShowCreateModal(false);
        // Reset form to clean state
        setTitle('');
        setCompanyName('');
        setDescription('');
        setLocation('');
        setSalaryRange('');
        setSkillsList([
          { skillName: 'React', minimumProficiency: 'INTERMEDIATE' },
          { skillName: 'Node.js', minimumProficiency: 'INTERMEDIATE' }
        ]);
        fetchJobs();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish requisition.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job requisition?')) return;
    try {
      await jobsAPI.delete(id);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Job Requisition Management</h1>
          <p className="text-xs text-slate-500 mt-1">Publish vacancies, calibrate required skills, and monitor candidate inflow</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition flex items-center shadow-md shadow-indigo-100"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>New Job Opening</span>
        </button>
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading requisitions...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Requisition Title</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Type & Salary</th>
                  <th className="px-6 py-3.5">Applications</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{job.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{job.companyName}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{job.location}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{job.salaryRange || 'Competitive'}</div>
                      <div className="text-[10px] text-slate-400">{job.employmentType.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        {job._count?.applications ?? 0} candidates
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Post New Requisition</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Consultancy Services (TCS)"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru, Karnataka (Hybrid)"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salary Range</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-slate-500 text-sm">
                      ₹
                    </span>
                    <input
                      type="text"
                      placeholder="14,00,000 - 22,00,000 (Per Annum)"
                      value={salaryRange.startsWith('₹') ? salaryRange.replace(/^₹\s*/, '') : salaryRange}
                      onChange={e => {
                        const raw = e.target.value.replace(/^₹\s*/, '');
                        setSalaryRange(raw ? `₹${raw}` : '');
                      }}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={e => setEmploymentType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
              </div>

              {/* Competency & Skill Proficiency Configuration */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="block font-bold text-slate-800 text-xs">
                  Required Skills & Minimum Proficiency Levels *
                </label>
                <p className="text-[11px] text-slate-500">
                  Specify each technical skill required for this role along with the minimum proficiency standard expected.
                </p>

                {/* Skill Adder Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="e.g. React, Docker, Python..."
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="flex-1 w-full p-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs text-slate-800"
                  />
                  <select
                    value={newSkillLevel}
                    onChange={e => setNewSkillLevel(e.target.value as any)}
                    className="w-full sm:w-auto p-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-semibold text-slate-700"
                  >
                    <option value="BEGINNER">BEGINNER (Basic)</option>
                    <option value="INTERMEDIATE">INTERMEDIATE (Competent)</option>
                    <option value="ADVANCED">ADVANCED (Senior)</option>
                    <option value="EXPERT">EXPERT (Lead / Architect)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    + Add Skill
                  </button>
                </div>

                {/* Active Skills List Tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {skillsList.map(sk => (
                    <span
                      key={sk.skillName}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 shadow-2xl shadow-indigo-100"
                    >
                      <span className="font-bold">{sk.skillName}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        sk.minimumProficiency === 'EXPERT'
                          ? 'bg-purple-100 text-purple-800'
                          : sk.minimumProficiency === 'ADVANCED'
                          ? 'bg-indigo-100 text-indigo-800'
                          : sk.minimumProficiency === 'INTERMEDIATE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {sk.minimumProficiency}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk.skillName)}
                        className="text-slate-400 hover:text-rose-600 ml-1 font-bold text-sm"
                        title="Remove skill"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Requirements *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe core responsibilities, engineering culture, and day-to-day work..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-sm disabled:opacity-60"
                >
                  {saving ? 'Publishing...' : 'Publish Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
