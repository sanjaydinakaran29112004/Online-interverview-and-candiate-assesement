import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/api';
import { Notification } from '../../types';
import { Bell, User, LogOut, CheckCircle2, Video, Award, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await notificationsAPI.list();
          if (res.data.success) {
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchNotifications();
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const roleBadgeColor = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    RECRUITER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    INTERVIEWER: 'bg-teal-100 text-teal-800 border-teal-200',
    CANDIDATE: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }[user?.role || 'CANDIDATE'];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">
                  InterviewAI
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  Enterprise Assessment SaaS
                </span>
              </div>
            </Link>

            {user && (
              <div className="hidden md:flex items-center space-x-1 pl-6">
                <Link to="/jobs" className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition">
                  Explore Jobs
                </Link>
                <Link to="/about" className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition">
                  About Platform
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-indigo-600 hover:underline font-semibold"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-400">No notifications yet.</div>
                        ) : (
                          notifications.map(n => (
                            <div
                              key={n.id}
                              className={`p-3.5 text-sm hover:bg-slate-50 transition cursor-pointer ${
                                !n.isRead ? 'bg-indigo-50/50' : ''
                              }`}
                              onClick={() => {
                                if (n.link) navigate(n.link);
                                setShowNotifications(false);
                              }}
                            >
                              <div className="font-semibold text-slate-800 flex items-center justify-between text-xs sm:text-sm">
                                <span>{n.title}</span>
                                <span className="text-xs text-slate-400">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 p-1.5 px-2.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-left hidden md:block">
                      <div className="text-sm font-bold text-slate-800 leading-tight">{user.name}</div>
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${roleBadgeColor}`}>
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-3 border-b border-slate-100 text-sm">
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition"
                      >
                        <User className="w-4 h-4 mr-2.5 text-slate-400" /> My Profile
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut className="w-4 h-4 mr-2.5" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-xl transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
