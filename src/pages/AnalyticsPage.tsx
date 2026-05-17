import React from 'react';
import { Download } from 'lucide-react';
import RevenueChart from '../components/charts/RevenueChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import ComparisonBarChart from '../components/charts/ComparisonBarChart';
import FilterBar from '../components/filters/FilterBar';
import { useAnalytics } from '../hooks/useAnalytics';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { exportElementToPNG } from '../utils/exportUtils';
import { formatCurrency, formatNumber, formatPercent } from '../utils';

const AnalyticsPage: React.FC = () => {
  const { kpis, monthlyData, categoryData, regionData, statusData } = useAnalytics();
  const { sheetsLoading } = useGoogleSheets();
  const isLoading = sheetsLoading === 'loading';

  const topCategories = [...categoryData].sort((a, b) => b.value - a.value).slice(0, 5);
  const totalCatRevenue = topCategories.reduce((s, c) => s + c.value, 0);

  const handleExportPNG = (id: string, filename: string) => {
    exportElementToPNG(id, filename);
  };

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      <FilterBar />

      {/* Revenue Trend */}
      <div className="relative group" id="chart-revenue">
        <RevenueChart data={monthlyData} loading={isLoading} />
        <button
          onClick={() => handleExportPNG('chart-revenue', 'revenue-trend.png')}
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-slate-100 hover:bg-slate-700 rounded-xl text-slate-600 hover:text-black transition-all shadow-md"
          title="Export as PNG"
        >
          <Download size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative group" id="chart-category">
          <CategoryPieChart data={categoryData} loading={isLoading} />
          <button
            onClick={() => handleExportPNG('chart-category', 'category-distribution.png')}
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-slate-100 hover:bg-slate-700 rounded-xl text-slate-600 hover:text-black transition-all shadow-md"
            title="Export as PNG"
          >
            <Download size={14} />
          </button>
        </div>
        
        <div className="relative group" id="chart-region">
          <ComparisonBarChart data={regionData} loading={isLoading} />
          <button
            onClick={() => handleExportPNG('chart-region', 'region-comparison.png')}
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-slate-100 hover:bg-slate-700 rounded-xl text-slate-600 hover:text-black transition-all shadow-md"
            title="Export as PNG"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative group" id="chart-status">
          <CategoryPieChart data={statusData} title="Order Status Distribution" loading={isLoading} />
          <button
            onClick={() => handleExportPNG('chart-status', 'status-distribution.png')}
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 bg-slate-100 hover:bg-slate-700 rounded-xl text-slate-600 hover:text-black transition-all shadow-md"
            title="Export as PNG"
          >
            <Download size={14} />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-black font-semibold text-sm mb-5">Top Revenue Categories</h3>
          <div className="space-y-4">
            {topCategories.map((cat, i) => {
              const pct = totalCatRevenue > 0 ? (cat.value / totalCatRevenue) * 100 : 0;
              return (
                <div key={cat.name} className="group/item">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold group-hover/item:text-black transition-colors">{i + 1}</span>
                      <span className="text-slate-700 text-sm font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-500 font-mono">{pct.toFixed(1)}%</span>
                      <span className="text-black font-bold">{formatCurrency(cat.value)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-black font-semibold text-sm mb-5">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue (30d)', value: formatCurrency(kpis.totalRevenue), delta: kpis.revenueGrowth },
            { label: 'Total Orders (30d)',  value: formatNumber(kpis.ordersCount),    delta: kpis.ordersGrowth },
            { label: 'Active Users (30d)',  value: formatNumber(kpis.activeUsers),    delta: kpis.usersGrowth },
            { label: 'Avg Conversion',      value: formatPercent(kpis.conversionRate), delta: kpis.conversionGrowth },
          ].map(m => (
            <div key={m.label} className="p-4 bg-white border border-slate-200/50 rounded-2xl hover:border-slate-300 transition-colors">
              <p className="text-slate-500 text-xs font-medium mb-2">{m.label}</p>
              <p className="text-black font-bold text-2xl tracking-tight">{m.value}</p>
              <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${m.delta >= 0 ? 'text-black' : 'text-black'}`}>
                {m.delta >= 0 ? '↗' : '↘'} {Math.abs(m.delta)}% vs prior
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;



