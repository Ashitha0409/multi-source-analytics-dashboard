import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
import type { MonthlyData } from '../../types';
import { formatCurrency } from '../../utils';

interface RevenueChartProps {
  data: MonthlyData[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-md min-w-[160px]">
      <p className="text-slate-500 text-xs mb-2 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
            <span className="text-slate-600 capitalize text-xs">{entry.dataKey}:</span>
          </div>
          <span className="text-slate-900 font-semibold text-xs">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading = false }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-slate-800 font-semibold text-sm">Sales & Profit Trend</h3>
          <p className="text-slate-400 text-xs mt-0.5">Monthly revenue and profit over time</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-500 rounded-full inline-block" />
            Sales
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 rounded-full inline-block" style={{ borderTop: '2px dashed #10b981', background: 'none', display: 'inline-block', width: 12, height: 0 }} />
            Profit
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-56 bg-slate-100 rounded-xl animate-pulse" />
      ) : data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => formatCurrency(v)}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Sales line */}
            <Line
              type="monotone"
              dataKey="revenue"
              name="Sales"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
            />

            {/* Profit line — dashed */}
            <Line
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RevenueChart;
