import React from 'react';
import { Activity, TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react';
import { useInsights, type Insight } from '../../hooks/useInsights';
import { clsx } from '../../utils';

const InsightIcon: React.FC<{ type: Insight['type'] }> = ({ type }) => {
  switch (type) {
    case 'positive': return <TrendingUp size={16} className="text-black" />;
    case 'negative': return <TrendingDown size={16} className="text-black" />;
    case 'neutral': return <Info size={16} className="text-black" />;
    case 'info': return <Activity size={16} className="text-black" />;
    default: return <AlertTriangle size={16} className="text-black" />;
  }
};

const InsightsPanel: React.FC = () => {
  const insights = useInsights();

  if (insights.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-black font-semibold text-lg tracking-tight">Business Insights</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {insights.map(insight => (
          <div 
            key={insight.id} 
            className="bg-white hover:bg-white transition-colors border border-slate-200 rounded-2xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <div className={clsx(
                'p-1.5 rounded-md flex-shrink-0',
                insight.type === 'positive' ? 'bg-emerald-500/10' :
                insight.type === 'negative' ? 'bg-red-500/10' :
                insight.type === 'info' ? 'bg-purple-200/10' : 'bg-blue-500/10'
              )}>
                <InsightIcon type={insight.type} />
              </div>
              <h4 className="text-black font-medium text-sm">{insight.title}</h4>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed mt-1">
              {insight.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsPanel;



