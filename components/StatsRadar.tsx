import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { PowerStats } from '../types';

interface StatsRadarProps {
  stats: PowerStats;
}

export const StatsRadar: React.FC<StatsRadarProps> = ({ stats }) => {
  const data = [
    { subject: 'INT', A: stats.intelligence, fullMark: 100 },
    { subject: 'STR', A: stats.strength, fullMark: 100 },
    { subject: 'SPD', A: stats.speed, fullMark: 100 },
    { subject: 'DUR', A: stats.durability, fullMark: 100 },
    { subject: 'PWR', A: stats.power, fullMark: 100 },
    { subject: 'CBT', A: stats.combat, fullMark: 100 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Stats"
            dataKey="A"
            stroke="#eab308"
            strokeWidth={2}
            fill="#eab308"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};