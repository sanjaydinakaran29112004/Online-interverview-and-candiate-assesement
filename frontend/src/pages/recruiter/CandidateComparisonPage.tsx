import React, { useState, useEffect } from 'react';
import { rankingAPI, jobsAPI } from '../../services/api';
import { Job } from '../../types';
import {
  Award,
  Users,
  BarChart2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  SlidersHorizontal
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
  Tooltip,
  Legend
} from 'recharts';

export const CandidateComparisonPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [rankedList, setRankedList] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await jobsAPI.list();
        if (res.data.success && res.data.jobs?.length > 0) {
          setJobs(res.data.jobs);
          setSelectedJobId(res.data.jobs[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchJobs();
  }, []);

  const loadRankings = async (jobId: string) => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await rankingAPI.getRankings(jobId);
      if (res.data.success) {
        const list = res.data.rankedCandidates || [];
        setRankedList(list);

        // Fetch comparative radar data for top 3 candidates
        if (list.length > 0) {
          const topIds = list.slice(0, 3).map((c: any) => c.candidate_id);
          const compRes = await rankingAPI.compareCandidates(topIds);
          if (compRes.data.success) {
            setComparisonData(compRes.data.comparison || []);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      loadRankings(selectedJobId);
    }
  }, [selectedJobId]);

  // Transform comparative radar data
  const radarMetrics = [
    { metric: 'Technical Test', fullMark: 100 },
    { metric: 'Live Interview', fullMark: 100 },
    { metric: 'Resume Alignment', fullMark: 100 },
    { metric: 'Overall Score', fullMark: 100 }
  ];

  const radarChartData = radarMetrics.map(m => {
    const row: any = { metric: m.metric };
    comparisonData.forEach(c => {
      if (m.metric === 'Technical Test') row[c.name] = c.technicalScore;
      else if (m.metric === 'Live Interview') row[c.name] = c.interviewScore;
      else if (m.metric === 'Resume Alignment') row[c.name] = c.resumeScore;
      else row[c.name] = c.overallScore;
    });
    return row;
  });

  const RADAR_COLORS = ['#6366f1', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            AI Candidate Ranking & Benchmarking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Explainable multi-criteria decision ranking synthesizing technical tests, live interviews, and resume fit
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-500">Requisition:</label>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none"
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Radar & Composite Breakdown */}
      {comparisonData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Multi-Candidate Radar Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Multi-Candidate Skill Radar</h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Top 3 Candidates
              </span>
            </div>

            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  {comparisonData.map((c, idx) => (
                    <Radar
                      key={c.candidateId}
                      name={c.name}
                      dataKey={c.name}
                      stroke={RADAR_COLORS[idx % RADAR_COLORS.length]}
                      fill={RADAR_COLORS[idx % RADAR_COLORS.length]}
                      fillOpacity={0.25}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Comparison */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 mb-4">Competency Score Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="technicalScore" name="Technical Test" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interviewScore" name="Live Interview" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resumeScore" name="Resume Alignment" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Ranked Candidate List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">
            Algorithmic Candidate Rankings ({rankedList.length})
          </h3>
          <span className="text-xs text-slate-400">
            Weighted: 35% Technical Test &bull; 30% Live Interview &bull; 20% Resume Fit &bull; 15% Experience
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Computing ranking matrices...</div>
        ) : rankedList.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">No applicants ranked for this requisition.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rankedList.map(cand => (
              <div key={cand.candidate_id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                    cand.rank === 1
                      ? 'bg-amber-400 text-amber-950 shadow-amber-100'
                      : cand.rank === 2
                      ? 'bg-slate-200 text-slate-800'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    #{cand.rank}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{cand.candidate_name}</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                      {cand.rank_explanation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-xs text-right shrink-0">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Composite Score</div>
                    <div className="text-lg font-black text-indigo-600">{cand.composite_score}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
