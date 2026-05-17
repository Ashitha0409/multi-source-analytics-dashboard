import React, { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { clsx } from '../../utils';

const DELIVERY_STATUS_OPTIONS = [
  { value: 'Delivered',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'In Transit', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'Delayed',    color: 'bg-red-100 text-red-700 border-red-200' },
];

// ── Chip toggle button ────────────────────────────────────────
const Chip: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  activeClass?: string;
}> = ({ label, active, onClick, activeClass = 'bg-indigo-600 text-white border-indigo-600' }) => (
  <button
    onClick={onClick}
    className={clsx(
      'px-2.5 py-0.5 rounded-full text-xs border font-medium transition-all whitespace-nowrap',
      active
        ? activeClass
        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
    )}
  >
    {label}
  </button>
);

// ── Section wrapper ───────────────────────────────────────────
const FilterSection: React.FC<{ label: string; count?: number; children: React.ReactNode }> = ({
  label, count, children,
}) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5">
      <label className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{label}</label>
      {count != null && count > 0 && (
        <span className="px-1.5 py-0 bg-indigo-100 text-indigo-600 text-[10px] rounded-full font-bold">
          {count}
        </span>
      )}
    </div>
    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
      {children}
    </div>
  </div>
);

// ── Main FilterBar ────────────────────────────────────────────
const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters } = useDashboardStore();
  const {
    availableCategories,
    productsByCategory,
    availableRegions,
    availableWarehouses,
  } = useAnalytics();

  const [expanded, setExpanded] = useState(false);

  // Products available for selected categories
  const productsForSelectedCats: string[] = filters.categories.length > 0
    ? [...new Set(filters.categories.flatMap(cat => productsByCategory[cat] ?? []))].sort()
    : [];

  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const activeCount =
    filters.categories.length +
    filters.products.length +
    filters.statuses.length +
    filters.regions.length +
    filters.warehouses.length +
    (filters.dateRange.start ? 1 : 0) +
    (filters.dateRange.end   ? 1 : 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

      {/* ── Header bar ─────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-slate-400" />
          <span className="text-slate-700 text-sm font-semibold">Filters</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full font-bold">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={e => { e.stopPropagation(); resetFilters(); }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={12} /> Clear all
            </button>
          )}
          {expanded
            ? <ChevronUp size={15} className="text-slate-400" />
            : <ChevronDown size={15} className="text-slate-400" />
          }
        </div>
      </div>

      {/* Active filter summary chips when collapsed */}
      {!expanded && activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {filters.categories.map(c => (
            <span key={c} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium">
              {c}
              <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setFilters({ categories: toggle(filters.categories, c), products: [] })} />
            </span>
          ))}
          {filters.products.map(p => (
            <span key={p} className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full text-xs font-medium">
              {p}
              <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setFilters({ products: toggle(filters.products, p) })} />
            </span>
          ))}
          {filters.regions.map(r => (
            <span key={r} className="flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-medium">
              {r}
              <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setFilters({ regions: toggle(filters.regions, r) })} />
            </span>
          ))}
          {filters.warehouses.map(w => (
            <span key={w} className="flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium">
              {w}
              <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setFilters({ warehouses: toggle(filters.warehouses, w) })} />
            </span>
          ))}
          {filters.statuses.map(s => (
            <span key={s} className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
              {s}
              <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setFilters({ statuses: toggle(filters.statuses, s) })} />
            </span>
          ))}
        </div>
      )}

      {/* ── Expanded filter panel ───────────────────────────── */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-4">

          {/* Row 1: Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1.5">From Date</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={e => setFilters({ dateRange: { ...filters.dateRange, start: e.target.value } })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1.5">To Date</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={e => setFilters({ dateRange: { ...filters.dateRange, end: e.target.value } })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Row 2: Category + Products (sub-filter) */}
          <FilterSection label="Category" count={filters.categories.length}>
            {availableCategories.map(cat => (
              <Chip
                key={cat}
                label={cat}
                active={filters.categories.includes(cat)}
                onClick={() => {
                  const next = toggle(filters.categories, cat);
                  // Clear product sub-filter if category is deselected
                  const validProducts = filters.products.filter(p =>
                    next.flatMap(c => productsByCategory[c] ?? []).includes(p)
                  );
                  setFilters({ categories: next, products: validProducts });
                }}
              />
            ))}
          </FilterSection>

          {/* Product sub-filter — only shown when a category is selected */}
          {productsForSelectedCats.length > 0 && (
            <div className="pl-3 border-l-2 border-indigo-200">
              <FilterSection label={`Products in ${filters.categories.join(', ')}`} count={filters.products.length}>
                {productsForSelectedCats.map(p => (
                  <Chip
                    key={p}
                    label={p}
                    active={filters.products.includes(p)}
                    activeClass="bg-violet-600 text-white border-violet-600"
                    onClick={() => setFilters({ products: toggle(filters.products, p) })}
                  />
                ))}
              </FilterSection>
            </div>
          )}

          {/* Row 3: Region + Warehouse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FilterSection label="Region" count={filters.regions.length}>
              {availableRegions.map(r => (
                <Chip
                  key={r}
                  label={r}
                  active={filters.regions.includes(r)}
                  activeClass="bg-sky-600 text-white border-sky-600"
                  onClick={() => setFilters({ regions: toggle(filters.regions, r) })}
                />
              ))}
            </FilterSection>

            <FilterSection label="Warehouse" count={filters.warehouses.length}>
              {availableWarehouses.map(w => (
                <Chip
                  key={w}
                  label={w}
                  active={filters.warehouses.includes(w)}
                  activeClass="bg-teal-600 text-white border-teal-600"
                  onClick={() => setFilters({ warehouses: toggle(filters.warehouses, w) })}
                />
              ))}
            </FilterSection>
          </div>

          {/* Row 4: Delivery Status */}
          <FilterSection label="Delivery Status" count={filters.statuses.length}>
            {DELIVERY_STATUS_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                label={opt.value}
                active={filters.statuses.includes(opt.value)}
                activeClass={opt.color + ' ring-1 ring-current ring-offset-1'}
                onClick={() => setFilters({ statuses: toggle(filters.statuses, opt.value) })}
              />
            ))}
          </FilterSection>

        </div>
      )}
    </div>
  );
};

export default FilterBar;
