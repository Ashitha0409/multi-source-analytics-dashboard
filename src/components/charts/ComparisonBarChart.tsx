import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
import type { ComparisonData } from '../../types';
import { formatCurrency } from '../../utils';

interface ComparisonBarChartProps {
  data: ComparisonData[];
  title?: string;
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 shadow-sm min-w-[160px]">
      <p className="text-slate-600 text-xs mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: entry.fill }} />
            <span className="text-slate-600">{entry.dataKey === 'current' ? 'Current' : 'Previous'}:</span>
          </div>
          <span className="text-black font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

const ComparisonBarChart: React.FC<ComparisonBarChartProps> = ({
  data, title = 'Revenue by Region', loading = false,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-black font-semibold text-sm">{title}</h3>
          <p className="text-slate-400 text-xs mt-0.5">Current vs previous period</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: '#2563eb' }} />Current</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: '#a78bfa' }} />Previous</span>
        </div>
      </div>

      {loading ? (
        <div className="h-56 bg-slate-100 rounded-xl animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => formatCurrency(v)}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
            <Bar dataKey="current" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="previous" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ComparisonBarChart;



