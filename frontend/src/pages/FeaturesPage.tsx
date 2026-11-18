import React from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Cpu,
  ShieldCheck,
  Award,
  BarChart3,
  CheckCircle2,
  HelpCircle,
  FileText,
  Users,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const featureList = [
    {
      icon: Cpu,
      title: '5-Dimensional AI Answer Scoring',
      desc: 'Evaluates answers on Technical Correctness (30%), Semantic Relevance (25%), Conceptual Depth (20%), Completeness (15%), and Keyword Coverage (10%).',
      tag: 'Core AI Engine'
    },
    {
      icon: FileText,
      title: 'Automated Resume Parsing & Matching',
      desc: 'Extracts skills, education, and years of experience from PDF/DOCX resumes and computes transparent compatibility against job openings.',
      tag: 'NLP Parser'
    },
    {
      icon: HelpCircle,
      title: 'Adaptive Question Bank Generation',
      desc: 'Dynamically synthesizes role-tailored interview questions with expected conceptual anchors, rubrics, and time limits across 6 categories.',
      tag: 'Generative Rubrics'
    },
    {
      icon: Video,
      title: 'Low-Latency WebRTC Video Rooms',
      desc: 'Peer-to-peer audio and video streaming, screen sharing, in-room real-time chat, recording consent, and synchronized live question prompts.',
      tag: 'Real-Time WebRTC'
    },
    {
      icon: Award,
      title: 'Multi-Criteria Candidate Ranking',
      desc: 'Ranks multiple applicants for the same job opening using weighted synthesis with explainable reasons and comparative Radar charts.',
      tag: 'Ranking Engine'
    },
    {
      icon: BarChart3,
      title: 'Live Recruitment Analytics',
      desc: 'Comprehensive dashboards with real database metrics: cohort skill competency, application funnel, and assessment score distributions.',
      tag: 'Analytics'
    },
    {
      icon: ShieldCheck,
      title: 'Human-in-the-Loop Oversight',
      desc: 'Interviewers can inspect every AI evaluation and apply documented score overrides tracked in an immutable security audit log.',
      tag: 'Ethical AI'
    },
    {
      icon: Layers,
      title: 'Downloadable PDF Assessment Reports',
      desc: 'Generates branded, audit-ready multi-page PDF evaluation reports complete with skill bars, questions, answers, and recruiter recommendations.',
      tag: 'Official Reports'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Platform Capabilities & Module Inventory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Enterprise Recruitment & Assessment Features
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Explore all 14 core modules designed for high-integrity candidate assessment, automated scheduling, and objective evidence-based recruitment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {featureList.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mt-2">{item.title}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-indigo-600 flex items-center">
                <span>Production-ready</span>
                <CheckCircle2 className="w-3.5 h-3.5 ml-1.5 text-emerald-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Box */}
      <div className="bg-gradient-to-r from-indigo-900 to-brand-800 rounded-3xl p-8 text-white shadow-xl text-center max-w-3xl mx-auto space-y-4">
        <h3 className="text-xl font-extrabold">Ready to Experience the Platform?</h3>
        <p className="text-xs text-indigo-100 max-w-xl mx-auto leading-relaxed">
          Sign in immediately with one-click development demo accounts or explore open engineering vacancies.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="px-5 py-2.5 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow-md hover:bg-indigo-50 transition"
          >
            Launch Demo Accounts
          </Link>
          <Link
            to="/jobs"
            className="px-5 py-2.5 bg-indigo-700/80 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl border border-indigo-500 transition"
          >
            Explore Openings &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
