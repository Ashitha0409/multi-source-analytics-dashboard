import React from 'react';
import { Download } from 'lucide-react';
import FilterBar from '../components/filters/FilterBar';
import DataTable from '../components/table/DataTable';
import { useDashboardStore } from '../store/dashboardStore';
import { exportToCSV } from '../utils/exportUtils';
import { clsx } from '../utils';

const DataPage: React.FC = () => {
  const { filteredRows, dataSources, pagination, setPagination } = useDashboardStore();

  const handleExport = () => {
    exportToCSV(filteredRows, 'datapulse_export.csv');
  };

  const pageSizeOptions = [10, 15, 25, 50, 100];

  return (
    <div className="space-y-6 pb-8">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {dataSources.map(src => (
            <div
              key={src.id}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs shadow-sm"
            >
              <span
                className={clsx(
                  'w-2 h-2 rounded-full',
                  src.status === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                  src.status === 'loading' ? 'bg-amber-400 animate-pulse' :
                  src.status === 'error'   ? 'bg-red-400' : 'bg-slate-600'
                )}
              />
              <span className="text-slate-700 font-medium">{src.name}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{src.rowCount.toLocaleString()} rows</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-purple-200 text-black hover:bg-purple-200 text-black text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <FilterBar />

      <div className="flex items-center justify-between mt-2">
        <p className="text-slate-500 text-sm">
          <span className="text-black font-semibold">{filteredRows.length.toLocaleString()}</span> records found
        </p>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
          <label className="text-slate-500 text-xs font-medium uppercase tracking-wide">Rows per page</label>
          <select
            value={pagination.pageSize}
            onChange={e => setPagination({ pageSize: Number(e.target.value), page: 1 })}
            className="bg-transparent text-black text-sm focus:outline-none cursor-pointer"
          >
            {pageSizeOptions.map(n => (
              <option key={n} value={n} className="bg-white">{n}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable />
    </div>
  );
};

export default DataPage;



