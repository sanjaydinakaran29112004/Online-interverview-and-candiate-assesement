import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  isAdmin: boolean;
  isRecruiter: boolean;
  isInterviewer: boolean;
  isCandidate: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authAPI.me();
          if (res.data?.user) {
            setUser(res.data.user);
            sessionStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Login error' };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await authAPI.register(data);
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Registration error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updated };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isRecruiter = role === 'RECRUITER';
  const isInterviewer = role === 'INTERVIEWER';
  const isCandidate = role === 'CANDIDATE';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        isAdmin,
        isRecruiter,
        isInterviewer,
        isCandidate
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
