import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import {
  BarChart3,
  Award,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Clock,
  Radar as RadarIcon
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await analyticsAPI.performance();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-400">Loading performance analytics...</div>;
  }

  const metrics = data?.metrics || {};
  const skillCompetency = data?.skillCompetency || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recruitment Analytics & Insights</h1>
        <p className="text-xs text-slate-500 mt-1">
          Deep telemetry across assessment completion rates, technical benchmarks, and cross-functional skill performance
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Assessment Success Rate</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.completionRate}%</div>
          <span className="text-[11px] text-slate-500 font-semibold">Completed interview ratio</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Avg Technical Score</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{metrics.avgTechnicalScore}%</div>
          <span className="text-[11px] text-slate-500 font-semibold">Across all assessed candidates</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Avg Interview Score</span>
          <div className="text-2xl font-black text-teal-600 mt-1">{metrics.avgInterviewScore}%</div>
          <span className="text-[11px] text-slate-500 font-semibold">Live evaluation rubrics</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Sessions Held</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{metrics.totalInterviews}</div>
          <span className="text-[11px] text-slate-500 font-semibold">Recorded in database</span>
        </div>
      </div>

      {/* Radar & Competency Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 mb-4">Competency Benchmark Radar</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillCompetency}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar
                  name="Cohort Average"
                  dataKey="averageScore"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.35}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 mb-4">Skill Performance Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillCompetency}>
                <XAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="averageScore" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
