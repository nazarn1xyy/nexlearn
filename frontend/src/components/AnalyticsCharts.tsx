'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Props {
  type: 'scoreDistribution' | 'testComparison';
  data: any[];
}

export default function AnalyticsCharts({ type, data }: Props) {
  if (type === 'scoreDistribution') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#888' }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#888' }} />
          <Tooltip
            contentStyle={{
              borderRadius: '10px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
            }}
          />
          <Bar dataKey="count" name="Кількість" fill="#0f0f0f" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'testComparison') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
          <YAxis tick={{ fontSize: 12, fill: '#888' }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              borderRadius: '10px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="avg_score" name="Середній бал" fill="#0f0f0f" radius={[6, 6, 0, 0]} />
          <Bar dataKey="pass_rate" name="Успішність %" fill="#888" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
