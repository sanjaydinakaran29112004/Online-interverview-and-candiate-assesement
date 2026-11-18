import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Mail, Phone, Briefcase, Award, CheckCircle2, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.candidateProfile?.phone || user?.recruiterProfile?.phone || '');
  const [headline, setHeadline] = useState(user?.candidateProfile?.headline || '');
  const [summary, setSummary] = useState(user?.candidateProfile?.summary || '');
  const [technicalSkills, setTechnicalSkills] = useState(user?.candidateProfile?.technicalSkills || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.candidateProfile?.portfolioUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.candidateProfile?.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(user?.candidateProfile?.githubUrl || '');
  const [companyName, setCompanyName] = useState(user?.recruiterProfile?.companyName || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        name,
        phone,
        headline,
        summary,
        technicalSkills,
        portfolioUrl,
        linkedinUrl,
        githubUrl,
        companyName
      });
      if (res.data.success) {
        updateUser({ name });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your identity, professional contact details, and technical profile</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 555-010-4001"
              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {user?.role === 'CANDIDATE' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Professional Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer | React & Cloud"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Technical Skills</label>
                <input
                  type="text"
                  value={technicalSkills}
                  onChange={e => setTechnicalSkills(e.target.value)}
                  placeholder="React, Node.js, TypeScript, PostgreSQL"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GitHub URL</label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={e => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {user?.role === 'RECRUITER' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            {saved && (
              <span className="text-emerald-700 font-bold flex items-center text-xs">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                Profile updated successfully.
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition flex items-center space-x-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
