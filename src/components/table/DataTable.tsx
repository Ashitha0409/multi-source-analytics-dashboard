import React from 'react';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import {
  formatCurrency, formatDate, deliveryStatusColor,
  totalPages, clsx,
} from '../../utils';
import type { DataRow } from '../../types';

// ── Columns that match your actual Google Sheets data ─────────
const COLUMNS: { key: keyof DataRow; label: string; sortable: boolean }[] = [
  { key: 'id',             label: 'Order ID',        sortable: true  },
  { key: 'date',           label: 'Order Date',      sortable: true  },
  { key: 'product',        label: 'Product',         sortable: true  },
  { key: 'category',       label: 'Category',        sortable: true  },
  { key: 'region',         label: 'Region',          sortable: true  },
  { key: 'quantity',       label: 'Qty',             sortable: true  },
  { key: 'revenue',        label: 'Sales (₹)',       sortable: true  },
  { key: 'profit',         label: 'Profit (₹)',      sortable: true  },
  { key: 'deliveryStatus', label: 'Delivery Status', sortable: true  },
  { key: 'warehouse',      label: 'Warehouse',       sortable: true  },
  { key: 'deliveryTime',   label: 'Delivery (days)', sortable: true  },
  { key: 'shippingCost',   label: 'Shipping (₹)',    sortable: true  },
];

const SortIcon: React.FC<{ col: string; active: string; dir: 'asc' | 'desc' }> = ({ col, active, dir }) => {
  if (col !== active) return <ChevronsUpDown size={12} className="text-slate-400" />;
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-indigo-600" />
    : <ChevronDown size={12} className="text-indigo-600" />;
};

const DataTable: React.FC<{ hidePagination?: boolean }> = ({ hidePagination = false }) => {
  const { tableSort, pagination, setTableSort, setPagination, filteredRows } = useDashboardStore();
  const { pagedRows } = useAnalytics();
  const pages = totalPages(filteredRows.length, pagination.pageSize);

  const handleSort = (col: keyof DataRow) => {
    if (!COLUMNS.find(c => c.key === col)?.sortable) return;
    setTableSort({
      column: col,
      direction: tableSort.column === col && tableSort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
      <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-300">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white border-b border-slate-200">
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={clsx(
                    'text-left py-3 px-4 text-slate-500 font-semibold text-xs whitespace-nowrap select-none tracking-wide',
                    col.sortable && 'cursor-pointer hover:text-slate-800 transition-colors'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <SortIcon
                        col={col.key as string}
                        active={tableSort.column as string}
                        dir={tableSort.direction}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="text-center text-slate-400 py-20">
                  <div className="flex flex-col items-center gap-2">
                    <AlertTriangle size={24} className="text-slate-300" />
                    <p>No records match your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              pagedRows.map(row => (
                <tr
                  key={row.id + (row.isDuplicate ? '-dup' : '')}
                  className={clsx(
                    'transition-colors',
                    row.isDuplicate
                      ? 'bg-amber-50 hover:bg-amber-100'
                      : 'hover:bg-slate-50'
                  )}
                >
                  {/* Order ID */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {row.isDuplicate && <AlertTriangle size={11} className="text-amber-500" />}
                      <span className="font-mono text-xs text-slate-700">{row.id}</span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-xs">
                    {formatDate(row.date)}
                  </td>

                  {/* Product */}
                  <td className="py-3 px-4 text-slate-700 text-xs font-medium">
                    {row.product ?? '—'}
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-xs font-medium">
                      {row.category}
                    </span>
                  </td>

                  {/* Region */}
                  <td className="py-3 px-4 text-slate-600 text-xs">{row.region ?? '—'}</td>

                  {/* Quantity */}
                  <td className="py-3 px-4 text-slate-700 text-sm font-medium">
                    {row.quantity ?? row.orders ?? '—'}
                  </td>

                  {/* Sales */}
                  <td className="py-3 px-4 text-slate-900 font-semibold text-sm">
                    {row.revenue > 0 ? formatCurrency(row.revenue) : '—'}
                  </td>

                  {/* Profit */}
                  <td className={clsx(
                    'py-3 px-4 font-semibold text-sm',
                    (row.profit ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-600'
                  )}>
                    {row.profit != null && row.profit !== 0 ? formatCurrency(row.profit) : '—'}
                  </td>

                  {/* Delivery Status */}
                  <td className="py-3 px-4">
                    {row.deliveryStatus ? (
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-medium border',
                        deliveryStatusColor(row.deliveryStatus)
                      )}>
                        {row.deliveryStatus}
                      </span>
                    ) : '—'}
                  </td>

                  {/* Warehouse */}
                  <td className="py-3 px-4 text-slate-600 text-xs">{row.warehouse ?? '—'}</td>

                  {/* Delivery Time */}
                  <td className="py-3 px-4 text-slate-700 text-xs">
                    {row.deliveryTime ? `${row.deliveryTime}d` : '—'}
                  </td>

                  {/* Shipping Cost */}
                  <td className="py-3 px-4 text-slate-700 text-xs">
                    {row.shippingCost ? formatCurrency(row.shippingCost) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!hidePagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
          <p className="text-slate-400 text-xs">
            Showing{' '}
            <span className="text-slate-700 font-medium">
              {Math.min((pagination.page - 1) * pagination.pageSize + 1, filteredRows.length)}–
              {Math.min(pagination.page * pagination.pageSize, filteredRows.length)}
            </span>{' '}
            of{' '}
            <span className="text-slate-700 font-medium">{filteredRows.length.toLocaleString()}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagination({ page: pagination.page - 1 })}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const page =
                pages <= 5 ? i + 1
                : pagination.page <= 3 ? i + 1
                : pagination.page >= pages - 2 ? pages - 4 + i
                : pagination.page - 2 + i;
              return (
                <button
                  key={page}
                  onClick={() => setPagination({ page })}
                  className={clsx(
                    'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                    pagination.page === page
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  )}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setPagination({ page: pagination.page + 1 })}
              disabled={pagination.page >= pages}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
