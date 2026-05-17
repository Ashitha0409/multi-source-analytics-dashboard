import React, { useState } from 'react';
import FileUploadZone from '../components/upload/FileUploadZone';
import { useDashboardStore } from '../store/dashboardStore';
import { formatCurrency, formatDate, statusColor, clsx } from '../utils';
import { FileSpreadsheet, Database, ArrowRight, AlertTriangle } from 'lucide-react';

// ── Main Page ─────────────────────────────────────────────────────────────────

const UploadPage: React.FC = () => {
  const { uploadedFiles, filteredRows, allRows } = useDashboardStore();
  const totalUploadedRows = uploadedFiles.reduce((s, f) => s + f.rowCount, 0);
  const duplicatesCount = allRows.filter(r => r.isDuplicate).length;

  return (
    <div className="space-y-6 pb-8 max-w-5xl mx-auto">

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-200/10 border border-slate-200 flex items-center justify-center">
              <FileSpreadsheet size={16} className="text-black" />
            </div>
            <p className="text-slate-600 text-xs font-medium">Files</p>
          </div>
          <p className="text-black font-bold text-2xl">{uploadedFiles.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Database size={16} className="text-black" />
            </div>
            <p className="text-slate-600 text-xs font-medium">Imported Rows</p>
          </div>
          <p className="text-black font-bold text-2xl">{totalUploadedRows.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle size={16} className="text-black" />
            </div>
            <p className="text-slate-600 text-xs font-medium">Duplicates</p>
          </div>
          <p className="text-black font-bold text-2xl">{duplicatesCount.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-200/10 border border-purple-500/20 flex items-center justify-center">
              <ArrowRight size={16} className="text-purple-400" />
            </div>
            <p className="text-slate-600 text-xs font-medium">Active Records</p>
          </div>
          <p className="text-black font-bold text-2xl">{filteredRows.length.toLocaleString()}</p>
        </div>
      </div>

      {/* Upload zone */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-black font-semibold text-lg mb-4">Import Data</h2>
        <FileUploadZone />
      </div>

      {/* Preview: shows ONLY uploaded file rows */}
      {uploadedFiles.length > 0 && <UploadedDataPreview />}
    </div>
  );
};

// ── Uploaded-only preview ─────────────────────────────────────────────────────

const UploadedDataPreview: React.FC = () => {
  const { uploadedFiles } = useDashboardStore();
  const [activeFileId, setActiveFileId] = useState<string>('all');

  const previewRows =
    activeFileId === 'all'
      ? uploadedFiles.flatMap(f => f.data)
      : (uploadedFiles.find(f => f.id === activeFileId)?.data ?? []);

  const displayed = previewRows.slice(0, 50);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-black font-semibold text-lg">Data Preview</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Showing rows from your uploaded file(s) only
          </p>
        </div>

        {/* Per-file tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveFileId('all')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              activeFileId === 'all'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
            )}
          >
            All Files ({uploadedFiles.reduce((s, f) => s + f.rowCount, 0).toLocaleString()} rows)
          </button>
          {uploadedFiles.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFileId(f.id)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                activeFileId === f.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400 hover:text-indigo-700'
              )}
            >
              {f.name} ({f.rowCount} rows)
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-10">
            <tr>
              {['ID', 'Date', 'Category', 'Product', 'Region', 'Revenue', 'Orders', 'Users', 'Conv. Rate', 'Status'].map(h => (
                <th
                  key={h}
                  className="text-left py-3 px-4 text-slate-600 font-semibold text-xs whitespace-nowrap tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center text-slate-500 py-12 text-sm">
                  No data found in this file.
                </td>
              </tr>
            ) : (
              displayed.map((row, i) => (
                <tr key={row.id + i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-xs text-black">{row.id}</td>
                  <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap text-xs">{formatDate(row.date)}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{row.category}</span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 text-xs">{row.product ?? '—'}</td>
                  <td className="py-2.5 px-4 text-slate-600 text-xs">{row.region ?? '—'}</td>
                  <td className="py-2.5 px-4 text-black font-medium text-xs">{formatCurrency(row.revenue)}</td>
                  <td className="py-2.5 px-4 text-slate-700 text-xs">{row.orders}</td>
                  <td className="py-2.5 px-4 text-slate-700 text-xs">{row.users || '—'}</td>
                  <td className="py-2.5 px-4 text-slate-700 text-xs">
                    {row.conversionRate ? `${row.conversionRate}%` : '—'}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium border', statusColor(row.status))}>
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {previewRows.length > 50 && (
          <p className="text-center text-slate-400 text-xs py-3 border-t border-slate-100">
            Showing first 50 of {previewRows.length.toLocaleString()} rows — combine to see all in Data page
          </p>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
