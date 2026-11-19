import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

interface ScoreRadarChartProps {
  metrics: {
    technicalAccuracy: number;
    problemSolving: number;
    communicationClarity: number;
    depthOfKnowledge: number;
    practicalRelevance: number;
  };
}

export const ScoreRadarChart: React.FC<ScoreRadarChartProps> = ({ metrics }) => {
  const data = [
    { subject: 'Technical Accuracy', score: metrics.technicalAccuracy || 0, fullMark: 100 },
    { subject: 'Problem Solving', score: metrics.problemSolving || 0, fullMark: 100 },
    { subject: 'Communication', score: metrics.communicationClarity || 0, fullMark: 100 },
    { subject: 'Depth of Knowledge', score: metrics.depthOfKnowledge || 0, fullMark: 100 },
    { subject: 'Practical Relevance', score: metrics.practicalRelevance || 0, fullMark: 100 }
  ];

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Radar
            name="Competency Rubric"
            dataKey="score"
            stroke="#4f46e5"
            fill="#6366f1"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
