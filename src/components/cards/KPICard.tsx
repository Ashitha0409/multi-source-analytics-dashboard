import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { clsx } from '../../utils';

interface KPICardProps {
  title: string;
  value: number;
  formatFn?: (val: number) => string;
  growth: number;
  icon: React.FC<{ size?: number; className?: string }>;
  loading?: boolean;
  emptyLabel?: string;  // shown instead of value when data is unavailable
}

const KPICard: React.FC<KPICardProps> = ({
  title, value, formatFn = (v) => v.toString(), growth, icon: Icon, loading = false, emptyLabel,
}) => {
  const isPositive = growth > 0;
  const isNeutral  = growth === 0;

  return (
    <div className="relative group bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300/80 hover:shadow-lg hover:shadow-sm transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-slate-100 rounded" />
            <div className="h-9 w-9 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-8 w-24 bg-slate-100 rounded" />
          <div className="h-4 w-20 bg-slate-100 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className="text-slate-500 text-sm font-medium tracking-wide">{title}</p>
            <Icon size={18} className="text-purple-300" />
          </div>

          <p className="text-black text-3xl font-bold tracking-tight mb-2 relative z-10">
            {emptyLabel ? (
              <span className="text-slate-300 text-lg font-medium">{emptyLabel}</span>
            ) : formatFn(value)}
          </p>

          <div className="flex items-center gap-2 relative z-10">
            <div className={clsx(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide',
              isNeutral ? 'bg-slate-100 text-slate-600' : 
              isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
              'bg-red-50 text-red-700 border border-red-200'
            )}>
              {isNeutral ? <Minus size={12} /> : isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isNeutral ? '0%' : `${Math.abs(growth)}%`}
            </div>
            <span className="text-slate-400 text-xs font-medium">vs last 90d</span>
          </div>
        </>
      )}
    </div>
  );
};

export default KPICard;



