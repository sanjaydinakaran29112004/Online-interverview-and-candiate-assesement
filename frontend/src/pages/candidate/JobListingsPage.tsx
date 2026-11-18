import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI } from '../../services/api';
import { Job } from '../../types';
import { Search, MapPin, Briefcase, DollarSign, ArrowRight, Filter } from 'lucide-react';

export const JobListingsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [skill, setSkill] = useState('');
  const [employmentType, setEmploymentType] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.list({
        search: search || undefined,
        location: location || undefined,
        skill: skill || undefined,
        employmentType: employmentType || undefined
      });
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Explore Job Openings</h1>
        <p className="text-xs text-slate-500 mt-1">Discover technical requisitions matching your expertise</p>
      </div>

      {/* Filter / Search Bar */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Title or keywords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Location..."
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="relative">
          <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Skill (React, Node, etc)..."
            value={skill}
            onChange={e => setSkill(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <select
            value={employmentType}
            onChange={e => setEmploymentType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700"
          >
            <option value="">All Employment Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition flex items-center justify-center space-x-1.5 shadow-sm"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Apply Filters</span>
        </button>
      </form>

      {/* Jobs Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading published openings...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-700">No open jobs found</h3>
          <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map(job => (
            <div
              key={job.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{job.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{job.companyName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {job.employmentType.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2">{job.description}</p>

                {/* Skills Chips */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.skills?.slice(0, 5).map(s => (
                    <span
                      key={s.skillName}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {s.skillName}
                    </span>
                  ))}
                  {job.skills?.length > 5 && (
                    <span className="text-[10px] text-slate-400 py-0.5">+{job.skills.length - 5} more</span>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500 flex items-center space-x-3">
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {job.location}
                  </span>
                  {job.salaryRange && (
                    <span className="flex items-center text-slate-700 font-semibold">
                      <DollarSign className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                      {job.salaryRange}
                    </span>
                  )}
                </div>

                <Link
                  to={`/jobs/${job.id}`}
                  className="px-4 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition flex items-center"
                >
                  Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
