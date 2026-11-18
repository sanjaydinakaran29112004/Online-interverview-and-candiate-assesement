import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Video,
  Cpu,
  ShieldCheck,
  Award,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  FileCheck
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise AI Recruitment & Assessment Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Evidence-Based <span className="bg-gradient-to-r from-indigo-600 to-brand-500 bg-clip-text text-transparent">AI Interview</span> & Assessment Platform
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed">
              Automate resume matching, conduct real-time WebRTC video interviews, evaluate technical responses across 5 explainable rubric dimensions, and benchmark candidates with total transparency.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  to={user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'CANDIDATE' ? '/candidate/dashboard' : '/recruiter/dashboard'}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center justify-center"
                >
                  Enter Portal <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center justify-center"
                  >
                    Sign In to Portal <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-slate-700 border border-slate-300 font-bold text-sm hover:bg-slate-100 transition flex items-center justify-center"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5-Dimensional Assessment Pillars */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Rigorous, Explainable AI Evaluation
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Answers are evaluated against pre-calibrated rubrics across five weighted dimensions with human interviewer oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { title: 'Technical Correctness', weight: '30%', desc: 'Validates factual accuracy, avoiding misconceptions.', col: 'border-indigo-500' },
              { title: 'Semantic Relevance', weight: '25%', desc: 'TF-IDF & embedding alignment with core intent.', col: 'border-blue-500' },
              { title: 'Conceptual Depth', weight: '20%', desc: 'Evaluates reasoning markers, trade-offs, and causality.', col: 'border-teal-500' },
              { title: 'Completeness', weight: '15%', desc: 'Checks coverage of expected architectural criteria.', col: 'border-amber-500' },
              { title: 'Keyword Coverage', weight: '10%', desc: 'Verifies presence of critical domain terminology.', col: 'border-purple-500' }
            ].map(pillar => (
              <div key={pillar.title} className={`p-5 rounded-2xl bg-slate-50 border-t-4 ${pillar.col} border-x border-b border-slate-200`}>
                <div className="text-xs font-bold text-slate-400 uppercase">Weight: {pillar.weight}</div>
                <h4 className="font-extrabold text-sm text-slate-900 mt-1">{pillar.title}</h4>
                <p className="text-xs text-slate-600 mt-2">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
