import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI, reportAPI } from '../../services/api';
import { User, Role } from '../../types';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertCircle,
  Plus,
  Trash2,
  Building2,
  Briefcase,
  X,
  Eye,
  FileText,
  Award,
  Calendar,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Code2,
  Clock,
  Layers,
  ChevronRight,
  Download
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const viewIdParam = searchParams.get('viewId');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 360-degree User Details Modal States
  const [selectedUser360, setSelectedUser360] = useState<any | null>(null);
  const [loading360, setLoading360] = useState(false);
  const [activeTab360, setActiveTab360] = useState<'profile' | 'applications' | 'assessments' | 'security'>('profile');

  // Form states for creating a new user (Clean initial state - entered by admin)
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'RECRUITER' | 'INTERVIEWER' | 'CANDIDATE' | 'ADMIN'>('RECRUITER');
  const [newCompany, setNewCompany] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listUsers({
        role: roleFilter || undefined,
        search: searchTerm || undefined
      });
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.response?.data?.message || 'Failed to fetch users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  useEffect(() => {
    if (selectedUser360 || loading360 || showCreateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedUser360, loading360, showCreateModal]);

  // Open 360 profile if viewId passed in query
  useEffect(() => {
    if (viewIdParam) {
      handleOpen360(viewIdParam);
    }
  }, [viewIdParam]);

  const handleOpen360 = async (userId: string) => {
    setLoading360(true);
    setSelectedUser360(null);
    setActiveTab360('profile');
    try {
      const res = await adminAPI.getUser360(userId);
      if (res.data?.success) {
        setSelectedUser360(res.data.user);
      }
    } catch (err: any) {
      console.error('Failed to load user 360:', err);
      setMessage({ text: err.response?.data?.message || 'Failed to load user 360 profile.', type: 'error' });
    } finally {
      setLoading360(false);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminAPI.updateStatus(userId, newStatus);
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, status: newStatus as any } : u))
      );
      if (selectedUser360 && selectedUser360.id === userId) {
        setSelectedUser360({ ...selectedUser360, status: newStatus });
      }
      setMessage({ text: `Account status successfully updated to ${newStatus}.`, type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.response?.data?.message || 'Failed to update user status.', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the account for "${userName}"?`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedUser360?.id === userId) {
        setSelectedUser360(null);
      }
      setMessage({ text: `Account for ${userName} has been removed.`, type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.response?.data?.message || 'Failed to delete user.', type: 'error' });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await adminAPI.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        companyName: newRole === 'RECRUITER' ? newCompany : undefined,
        technicalDomain: newRole === 'INTERVIEWER' ? newDomain : undefined
      });

      if (res.data.success) {
        setMessage({ text: `Successfully created user account for ${newEmail}!`, type: 'success' });
        setShowCreateModal(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewCompany('');
        setNewDomain('');
        fetchUsers();
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.response?.data?.message || 'Failed to create user account.', type: 'error' });
    } finally {
      setCreating(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const roleColorBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'RECRUITER':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'INTERVIEWER':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            User Account Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage authentication status, 360&deg; profile dossiers, security permissions, and user provisioning across all roles
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-start space-x-3 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchUsers()}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {['', 'ADMIN', 'RECRUITER', 'INTERVIEWER', 'CANDIDATE'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r ? r : 'All Roles'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-20 text-sm text-slate-400">Loading user accounts...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Profile Specialty</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">360&deg; Dossier & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No user accounts match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs uppercase shadow-sm">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${roleColorBadge(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                        {u.candidateProfile?.headline ||
                          u.recruiterProfile?.companyName ||
                          u.interviewerProfile?.technicalDomain ||
                          'System Administrator'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpen360(u.id)}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition inline-flex items-center space-x-1.5 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>360&deg; Profile</span>
                          </button>

                          {u.role !== 'ADMIN' && (
                            <>
                              <button
                                onClick={() => handleStatusToggle(u.id, u.status)}
                                className={`px-2.5 py-1.5 rounded-xl font-semibold text-xs transition ${
                                  u.status === 'ACTIVE'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                                title="Delete Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 360-DEGREE USER DETAILS MODAL */}
      {(selectedUser360 || loading360) && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto w-full h-full min-h-screen top-0 left-0 right-0 bottom-0">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95">
            {loading360 ? (
              <div className="py-20 text-center text-slate-500 text-sm font-semibold flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Compiling 360-degree user dossier...</span>
              </div>
            ) : selectedUser360 ? (
              <div className="space-y-6">
                {/* Modal Top Header */}
                <div className="flex items-start justify-between pb-5 border-b border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                      {selectedUser360.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-black text-slate-900">{selectedUser360.name}</h2>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${roleColorBadge(
                            selectedUser360.role
                          )}`}
                        >
                          {selectedUser360.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedUser360.email}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        User ID: <span className="font-mono text-slate-600">{selectedUser360.id}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedUser360(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 360 Tabs */}
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab360('profile')}
                    className={`px-3 py-1.5 rounded-xl transition ${
                      activeTab360 === 'profile'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    1. Profile & Bio
                  </button>

                  {selectedUser360.role === 'CANDIDATE' && (
                    <>
                      <button
                        onClick={() => setActiveTab360('applications')}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          activeTab360 === 'applications'
                            ? 'bg-purple-100 text-purple-900'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        2. Applications ({selectedUser360.candidateProfile?.applications?.length || 0})
                      </button>
                      <button
                        onClick={() => setActiveTab360('assessments')}
                        className={`px-3 py-1.5 rounded-xl transition ${
                          activeTab360 === 'assessments'
                            ? 'bg-purple-100 text-purple-900'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        3. Assessments & Scores
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setActiveTab360('security')}
                    className={`px-3 py-1.5 rounded-xl transition ${
                      activeTab360 === 'security'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Security & Audit ({selectedUser360.auditLogs?.length || 0})
                  </button>
                </div>

                {/* Tab 1: Profile & Bio */}
                {activeTab360 === 'profile' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[10px]">Headline</span>
                        <div className="font-semibold text-slate-800 text-sm mt-0.5">
                          {selectedUser360.candidateProfile?.headline ||
                            selectedUser360.recruiterProfile?.companyName ||
                            selectedUser360.interviewerProfile?.technicalDomain ||
                            'Master Administrator'}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[10px]">Account Status</span>
                        <div className="mt-0.5">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full border ${
                              selectedUser360.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                            }`}
                          >
                            {selectedUser360.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[10px]">Account Created</span>
                        <div className="font-mono text-slate-700 mt-0.5">
                          {new Date(selectedUser360.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[10px]">Phone Contact</span>
                        <div className="text-slate-700 mt-0.5">
                          {selectedUser360.candidateProfile?.phone ||
                            selectedUser360.recruiterProfile?.phone ||
                            'Not provided'}
                        </div>
                      </div>
                    </div>

                    {/* Candidate specific details */}
                    {selectedUser360.role === 'CANDIDATE' && selectedUser360.candidateProfile && (
                      <div className="space-y-3">
                        <div>
                          <span className="font-bold text-slate-600 block mb-1">Extracted Technical Skills:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedUser360.candidateProfile.technicalSkills || 'React, TypeScript, Node.js, SQL')
                              .split(',')
                              .map((sk: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-bold border border-indigo-200"
                                >
                                  {sk.trim()}
                                </span>
                              ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="font-bold text-slate-400 uppercase text-[10px]">Experience</span>
                            <div className="font-bold text-slate-800 mt-0.5">
                              {selectedUser360.candidateProfile.experienceYears} Years
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="font-bold text-slate-400 uppercase text-[10px]">Education</span>
                            <div className="font-bold text-slate-800 mt-0.5">
                              {selectedUser360.candidateProfile.education || 'B.Tech in Computer Science'}
                            </div>
                          </div>
                        </div>

                        {selectedUser360.candidateProfile.resumes?.length > 0 && (
                          <div className="pt-2">
                            <span className="font-bold text-slate-600 block mb-1.5">Uploaded Resumes:</span>
                            <div className="space-y-1.5">
                              {selectedUser360.candidateProfile.resumes.map((r: any) => (
                                <div
                                  key={r.id}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                                >
                                  <div className="flex items-center space-x-2">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    <span className="font-medium text-slate-800">{r.originalName || r.fileName}</span>
                                  </div>
                                  <span className="text-slate-400 font-mono text-[10px]">
                                    {Math.round(r.fileSize / 1024)} KB &bull; {new Date(r.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Applications (Candidate) */}
                {activeTab360 === 'applications' && (
                  <div className="space-y-3">
                    {selectedUser360.candidateProfile?.applications?.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No job applications submitted by this candidate yet.
                      </div>
                    ) : (
                      selectedUser360.candidateProfile?.applications?.map((app: any) => (
                        <div
                          key={app.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{app.job?.title || 'Engineering Role'}</div>
                            <div className="text-slate-500">
                              {app.job?.companyName} &bull; {app.job?.location}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                              {app.status}
                            </span>
                            <div className="text-slate-400 text-[10px] mt-1 font-mono">
                              Applied: {new Date(app.appliedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 3: Assessments & Scores (Candidate) */}
                {activeTab360 === 'assessments' && (
                  <div className="space-y-3 text-xs">
                    {selectedUser360.candidateProfile?.assessments?.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No assessments recorded for this candidate.
                      </div>
                    ) : (
                      selectedUser360.candidateProfile?.assessments?.map((as: any) => (
                        <div key={as.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Overall Assessment Score</span>
                            <span className="text-lg font-black text-indigo-600">{as.overallScore}%</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-white border border-slate-100">
                              <span className="text-slate-400 text-[10px]">Technical</span>
                              <div className="font-bold text-slate-900">{as.technicalScore}%</div>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-slate-100">
                              <span className="text-slate-400 text-[10px]">Interview</span>
                              <div className="font-bold text-slate-900">{as.interviewScore}%</div>
                            </div>
                            <div className="p-2 rounded-xl bg-white border border-slate-100">
                              <span className="text-slate-400 text-[10px]">Resume Match</span>
                              <div className="font-bold text-slate-900">{as.resumeScore}%</div>
                            </div>
                          </div>
                          {as.strengthsSummary && (
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              <strong className="text-slate-800">Evaluator Feedback:</strong> {as.strengthsSummary}
                            </p>
                          )}

                          {as.report?.recruiterRecommendation && (
                            <div className="flex items-center justify-between pt-1">
                              <span className="font-bold text-slate-600">Interviewer Recommendation:</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                                as.report.recruiterRecommendation === 'STRONG_HIRE' || as.report.recruiterRecommendation === 'HIRE'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : as.report.recruiterRecommendation === 'NEXT_ROUND'
                                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                                  : as.report.recruiterRecommendation === 'HOLD'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-rose-100 text-rose-800 border-rose-200'
                              }`}>
                                {as.report.recruiterRecommendation.replace(/_/g, ' ')}
                              </span>
                            </div>
                          )}

                          {as.report?.id && (
                            <div className="pt-2">
                              <a
                                href={reportAPI.downloadPDFUrl(as.report.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Official PDF Report</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 4: Security & Audit Trail */}
                {activeTab360 === 'security' && (
                  <div className="space-y-2 text-xs">
                    {selectedUser360.auditLogs?.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No security audit logs recorded for this account.
                      </div>
                    ) : (
                      selectedUser360.auditLogs?.map((log: any) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-purple-700">{log.action}</span>
                            <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Status: <strong className="text-slate-800">{selectedUser360.status}</strong>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedUser360.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleStatusToggle(selectedUser360.id, selectedUser360.status)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
                          selectedUser360.status === 'ACTIVE'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {selectedUser360.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedUser360(null)}
                      className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow-sm"
                    >
                      Close Dossier
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Provision New User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 w-full h-full min-h-screen top-0 left-0 right-0 bottom-0">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Provision New Platform Account</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-5">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Account Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['RECRUITER', 'INTERVIEWER', 'CANDIDATE'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewRole(r)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                        newRole === r
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Sanjay Dinakaran"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="sanjay@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Temporary Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter initial password (min 6 characters)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {newRole === 'RECRUITER' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                    placeholder="e.g. Tata Consultancy Services (TCS) / Zoho Corp"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {newRole === 'INTERVIEWER' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Technical Domain</label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value)}
                    placeholder="e.g. Cloud Architecture, React, System Design"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition disabled:opacity-50"
                >
                  {creating ? 'Creating Account...' : 'Confirm Provisioning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
