import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface RadarChartProps {
  scores: { competency: string; score: number }[];
  maxScore?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ scores, maxScore = 10 }) => {
  // Преобразуем данные для recharts
  const data = scores.map((item) => ({
    subject: item.competency.length > 15 ? item.competency.slice(0, 15) + '...' : item.competency,
    value: item.score,
    fullName: item.competency,
  }));

  if (data.length === 0) {
    return <div className="muted">Нет данных для отображения</div>;
  }

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer>
        <RechartsRadar data={data} outerRadius="80%">
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#333' }} />
          <PolarRadiusAxis domain={[0, maxScore]} tickCount={6} />
          <Radar
            name="Оценки компетенций"
            dataKey="value"
            stroke="#2563EB"
            fill="#3B82F6"
            fillOpacity={0.6}
          />
          <Tooltip formatter={(value) => `${value} баллов`} labelFormatter={(label) => `Компетенция: ${label}`} />
          <Legend />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
};