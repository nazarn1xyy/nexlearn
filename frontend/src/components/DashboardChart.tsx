'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardChartProps {
  data: { name: string; score: number }[];
}

export default function DashboardChart({ data }: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorScoreDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15}/>
            <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:stroke-neutral-800" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
        <Tooltip 
          contentStyle={{ 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)'
          }}
          itemStyle={{ color: 'var(--foreground)' }}
          cursor={{ stroke: '#888', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Area 
          type="monotone" 
          dataKey="score" 
          stroke="currentColor" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorScore)" 
          className="text-black dark:text-white dark:fill-[url(#colorScoreDark)]"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
