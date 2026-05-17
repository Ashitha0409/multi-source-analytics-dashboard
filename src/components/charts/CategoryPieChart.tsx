import React from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  Tooltip, Legend,
} from 'recharts';
import type { CategoryData } from '../../types';
import { formatCurrency } from '../../utils';

interface CategoryPieChartProps {
  data: CategoryData[];
  title?: string;
  loading?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.payload.color }} />
        <span className="text-black text-sm font-medium">{d.name}</span>
      </div>
      <p className="text-black font-bold">{formatCurrency(d.value)}</p>
      <p className="text-slate-600 text-xs">{d.payload.percent ? `${(d.payload.percent * 100).toFixed(1)}%` : ''}</p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;   // hide labels for tiny slices
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data, title = 'Revenue by Category', loading = false,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5">
      <div className="mb-5">
        <h3 className="text-black font-semibold text-sm">{title}</h3>
        <p className="text-slate-500 text-xs mt-0.5">Distribution across categories</p>
      </div>

      {loading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full bg-slate-100 animate-pulse" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CategoryPieChart;



