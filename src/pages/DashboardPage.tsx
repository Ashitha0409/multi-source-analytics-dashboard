import React from 'react';
import {
  IndianRupee, Package, TrendingUp, Truck,
  AlertCircle, Info, Download, Clock,
} from 'lucide-react';
import KPICard from '../components/cards/KPICard';
import RevenueChart from '../components/charts/RevenueChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import ComparisonBarChart from '../components/charts/ComparisonBarChart';
import FilterBar from '../components/filters/FilterBar';
import InsightsPanel from '../components/cards/InsightsPanel';
import { useAnalytics } from '../hooks/useAnalytics';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { useDashboardStore } from '../store/dashboardStore';
import { exportElementToPNG } from '../utils/exportUtils';
import { formatCurrency, formatNumber, clsx } from '../utils';

const DashboardPage: React.FC = () => {
  const { kpis, monthlyData, categoryData, regionData, warehouseData, statusData } = useAnalytics();
  const { sheetsLoading, sheetsError } = useGoogleSheets();
  const { filteredRows, allRows } = useDashboardStore();

  const isLoading = sheetsLoading === 'loading';

  // Delivery status counts from filtered rows
  const deliveredCount  = filteredRows.filter(r => r.deliveryStatus === 'Delivered').length;
  const inTransitCount  = filteredRows.filter(r => r.deliveryStatus === 'In Transit').length;
  const delayedCount    = filteredRows.filter(r => r.deliveryStatus === 'Delayed').length;
  const hasDeliveryData = (deliveredCount + inTransitCount + delayedCount) > 0;

  // Profit margin
  const profitMargin = kpis.totalRevenue > 0
    ? ((kpis.totalProfit / kpis.totalRevenue) * 100).toFixed(1) + '%'
    : '—';

  return (
    <div className="space-y-6 pb-8 max-w-[1400px] mx-auto">

      {/* Google Sheets error banner */}
      {sheetsError && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-amber-700 font-medium">Google Sheets unavailable — </span>
            <span className="text-amber-600">{sheetsError.message}</span>
            <span className="text-amber-500 block mt-1 text-xs">
              Showing mock data. Go to Settings to configure your Sheet ID and API key.
            </span>
          </div>
        </div>
      )}

      {/* Record count + export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 shadow-sm">
          <Info size={14} className="text-slate-400" />
          <span>
            Showing <strong className="text-slate-800">{filteredRows.length.toLocaleString()}</strong> of{' '}
            <strong className="text-slate-800">{allRows.length.toLocaleString()}</strong> records
          </span>
        </div>
        <button
          onClick={() => exportElementToPNG('dashboard-container', 'datapulse-dashboard.png')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <Download size={16} /> Export Dashboard
        </button>
      </div>

      <FilterBar />

      {/* Empty state when filters return nothing */}
      {filteredRows.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-700 font-medium text-sm">No records match the current filters.</p>
          <p className="text-amber-500 text-xs mt-1">Try adjusting your date range, category, or delivery status selection.</p>
        </div>
      )}

      <div id="dashboard-container" className="space-y-6">

        {/* ── KPI Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            title="Total Sales Revenue"
            value={kpis.totalRevenue}
            formatFn={formatCurrency}
            growth={kpis.revenueGrowth}
            icon={IndianRupee}
            loading={isLoading}
            emptyLabel={kpis.totalRevenue === 0 ? 'No sales data' : undefined}
          />
          <KPICard
            title="Total Profit"
            value={kpis.totalProfit}
            formatFn={formatCurrency}
            growth={kpis.profitGrowth}
            icon={TrendingUp}
            loading={isLoading}
            emptyLabel={kpis.totalProfit === 0 && kpis.totalRevenue === 0 ? 'No sales data' : undefined}
          />
          <KPICard
            title="Units Sold"
            value={kpis.totalOrders}
            formatFn={formatNumber}
            growth={kpis.ordersGrowth}
            icon={Package}
            loading={isLoading}
            emptyLabel={kpis.totalOrders === 0 ? 'No sales data' : undefined}
          />
          <KPICard
            title="Avg Delivery Time"
            value={kpis.avgDeliveryTime}
            formatFn={v => v > 0 ? `${v.toFixed(1)} days` : '—'}
            growth={0}
            icon={Truck}
            loading={isLoading}
            emptyLabel={kpis.avgDeliveryTime === 0 ? 'No logistics data' : undefined}
          />
        </div>

        {/* ── Delivery Status Strip ──────────────────────────────── */}
        {hasDeliveryData && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-emerald-600 text-xs font-medium">Delivered</p>
                <p className="text-emerald-900 text-2xl font-bold">{deliveredCount}</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
              <div>
                <p className="text-amber-600 text-xs font-medium">In Transit</p>
                <p className="text-amber-900 text-2xl font-bold">{inTransitCount}</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              <div>
                <p className="text-red-600 text-xs font-medium">Delayed</p>
                <p className="text-red-900 text-2xl font-bold">{delayedCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Delivery Time Breakdown ────────────────────────────── */}
        {kpis.logisticsCount > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={15} className="text-slate-400" />
              <h3 className="text-slate-700 font-semibold text-sm">Delivery Time Breakdown</h3>
              <span className="text-slate-400 text-xs ml-auto">{kpis.logisticsCount} shipments · avg {kpis.avgDeliveryTime} days</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* Fast */}
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{kpis.fastDeliveries}</div>
                <div className="text-xs text-slate-500 mt-0.5">Fast (≤ 2 days)</div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: kpis.logisticsCount > 0 ? `${(kpis.fastDeliveries / kpis.logisticsCount) * 100}%` : '0%' }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {kpis.logisticsCount > 0 ? ((kpis.fastDeliveries / kpis.logisticsCount) * 100).toFixed(0) : 0}%
                </div>
              </div>
              {/* Normal */}
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{kpis.normalDeliveries}</div>
                <div className="text-xs text-slate-500 mt-0.5">Normal (3–5 days)</div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: kpis.logisticsCount > 0 ? `${(kpis.normalDeliveries / kpis.logisticsCount) * 100}%` : '0%' }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {kpis.logisticsCount > 0 ? ((kpis.normalDeliveries / kpis.logisticsCount) * 100).toFixed(0) : 0}%
                </div>
              </div>
              {/* Slow */}
              <div className="text-center">
                <div className={clsx('text-2xl font-bold', kpis.slowDeliveries > 0 ? 'text-red-600' : 'text-slate-400')}>
                  {kpis.slowDeliveries}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Slow (&gt; 5 days)</div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full transition-all"
                    style={{ width: kpis.logisticsCount > 0 ? `${(kpis.slowDeliveries / kpis.logisticsCount) * 100}%` : '0%' }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {kpis.logisticsCount > 0 ? ((kpis.slowDeliveries / kpis.logisticsCount) * 100).toFixed(0) : 0}%
                </div>
              </div>
            </div>
          </div>
        )}

        <InsightsPanel />

        {/* ── Revenue + Profit Trend ────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-2 shadow-sm">
          <RevenueChart data={monthlyData} loading={isLoading} />
        </div>

        {/* ── Category + Region + Warehouse Charts ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-2 shadow-sm">
            <CategoryPieChart data={categoryData} title="Revenue by Category" loading={isLoading} />
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-2 shadow-sm">
            <ComparisonBarChart data={regionData} title="Revenue by Region" loading={isLoading} />
          </div>
        </div>

        {/* Warehouse comparison — only show if data exists */}
        {warehouseData.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-2 shadow-sm">
            <ComparisonBarChart data={warehouseData} title="Revenue by Warehouse" loading={isLoading} />
          </div>
        )}

        {/* ── Delivery Status Donut + Business Summary ──────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-2 shadow-sm">
            <CategoryPieChart data={statusData} title="Delivery Status Breakdown" loading={isLoading} />
          </div>

          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-slate-800 font-semibold text-base mb-5">Business Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Profit Margin',        value: profitMargin },
                { label: 'Revenue / Unit',        value: kpis.totalOrders > 0 ? formatCurrency(kpis.totalRevenue / kpis.totalOrders) : '—' },
                { label: 'Total Shipping Cost',   value: kpis.totalShippingCost > 0 ? formatCurrency(kpis.totalShippingCost) : '—' },
                { label: 'Total Records',         value: allRows.length.toLocaleString() },
                { label: 'Filtered Records',      value: filteredRows.length.toLocaleString() },
                { label: 'Avg Delivery',          value: kpis.avgDeliveryTime > 0 ? `${kpis.avgDeliveryTime} days` : '—' },
              ].map(stat => (
                <div key={stat.label} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-slate-500 text-xs font-medium mb-1">{stat.label}</p>
                  <p className={clsx(
                    'font-bold text-xl',
                    stat.value === '—' ? 'text-slate-300' : 'text-slate-900'
                  )}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
