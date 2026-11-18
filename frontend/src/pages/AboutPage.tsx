import React from 'react';
import { Video, ShieldCheck, Cpu, Award, BookOpen, Layers } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">About The Platform</h1>
        <p className="text-xs text-slate-500 max-w-xl mx-auto">
          Architectural principles, scientific methodology, and ethical guidelines governing our AI-assisted recruitment platform
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
          <span>Scientific Mission & IEEE Foundations</span>
        </h3>
        <p>
          Recruitment workflows have historically suffered from inconsistent human grading, manual resume screening fatigue, or opaque "black-box" algorithmic filters that reject strong candidates based on rigid keyword requirements.
        </p>
        <p>
          This platform was engineered as an advanced final-year academic and research benchmark project to solve these challenges through transparent, multi-dimensional Natural Language Processing (NLP).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <Cpu className="w-6 h-6 text-indigo-600 mb-2" />
          <h4 className="font-bold text-slate-900 text-sm">Sub-symbolic NLP</h4>
          <p className="text-slate-500 text-xs mt-1">
            Combines sublinear TF-IDF vectorization, semantic cosine similarity, and contextual reasoning markers.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mb-2" />
          <h4 className="font-bold text-slate-900 text-sm">Zero Demographic Bias</h4>
          <p className="text-slate-500 text-xs mt-1">
            Strictly prohibits scoring on facial appearance, accent, gender, or inferred emotions.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <Video className="w-6 h-6 text-purple-600 mb-2" />
          <h4 className="font-bold text-slate-900 text-sm">Low-Latency WebRTC</h4>
          <p className="text-slate-500 text-xs mt-1">
            Direct peer-to-peer video streaming, screen sharing, and synchronized real-time question dispatch.
          </p>
        </div>
      </div>
    </div>
  );
};
