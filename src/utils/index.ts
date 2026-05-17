import type { DataRow, KPIData } from '../types';

// ─────────────────────────────────────────────────────────────
// KPI COMPUTATION
// Uses real fields from your Google Sheets:
//   Sales sheet  → revenue, profit, quantity
//   Logistics    → deliveryTime, shippingCost, deliveryStatus
// ─────────────────────────────────────────────────────────────

const splitPeriods = (rows: DataRow[], days = 90) => {
  // Always use today — never the max date in the dataset
  // (using dataset max caused KPIs to show 0 when filtering old data)
  const now = Date.now();

  const periodMs = days * 24 * 60 * 60 * 1000;
  const current: DataRow[] = [];
  const previous: DataRow[] = [];

  rows.forEach(row => {
    const t = new Date(row.date).getTime();
    if (t >= now - periodMs) current.push(row);
    else if (t >= now - 2 * periodMs) previous.push(row);
  });

  return { current, previous };
};

const sum = (rows: DataRow[], field: keyof DataRow): number =>
  rows.reduce((acc, r) => acc + ((r[field] as number) || 0), 0);

const avg = (rows: DataRow[], field: keyof DataRow): number =>
  rows.length === 0 ? 0 : sum(rows, field) / rows.length;

const growthPct = (curr: number, prev: number): number =>
  prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 1000) / 10;

export const computeKPIs = (rows: DataRow[]): KPIData => {
  // Use ALL filtered rows for delivery metrics (not just last 90d)
  // because delivery data is historical and filtering by date already scopes it
  const allFiltered = rows;

  // For period-based growth comparison, use 90-day windows
  const { current, previous } = splitPeriods(rows, 90);

  // ── Revenue & Profit (Sales sheet rows only) ──────────────
  // A row "has sales data" if it has revenue > 0 or quantity > 0
  const salesRows    = allFiltered.filter(r => r.revenue > 0 || r.quantity > 0);
  const curSales     = current.filter(r => r.revenue > 0 || r.quantity > 0);
  const prevSales    = previous.filter(r => r.revenue > 0 || r.quantity > 0);

  const totalRevenue = sum(salesRows, 'revenue');
  const prevRevenue  = sum(prevSales, 'revenue');
  const totalProfit  = sum(salesRows, 'profit');
  const prevProfit   = sum(prevSales, 'profit');
  const totalOrders  = sum(salesRows, 'quantity');
  const prevOrders   = sum(prevSales, 'quantity');

  // ── Delivery metrics (Logistics sheet rows only) ──────────
  // A row "has logistics data" if it has deliveryTime or shippingCost
  const logisticsRows  = allFiltered.filter(r => (r.deliveryTime ?? 0) > 0 || (r.shippingCost ?? 0) > 0);
  const totalShippingCost = sum(logisticsRows, 'shippingCost');

  const avgDeliveryTime = logisticsRows.length > 0
    ? Math.round(
        logisticsRows.reduce((a, r) => a + (r.deliveryTime ?? 0), 0) / logisticsRows.length * 10
      ) / 10
    : 0;

  // Delivery time buckets (for breakdown display)
  const fastDeliveries   = logisticsRows.filter(r => (r.deliveryTime ?? 0) <= 2).length;
  const normalDeliveries = logisticsRows.filter(r => (r.deliveryTime ?? 0) > 2 && (r.deliveryTime ?? 0) <= 5).length;
  const slowDeliveries   = logisticsRows.filter(r => (r.deliveryTime ?? 0) > 5).length;

  // Legacy compat
  const ordersCount    = totalOrders;
  const activeUsers    = sum(current, 'users');
  const prevUsers      = sum(previous, 'users');
  const conversionRate = 0;

  return {
    totalRevenue,
    totalProfit,
    totalOrders,
    avgDeliveryTime,
    totalShippingCost,
    fastDeliveries,
    normalDeliveries,
    slowDeliveries,
    logisticsCount: logisticsRows.length,

    // legacy compat
    ordersCount,
    activeUsers,
    conversionRate,

    revenueGrowth:    growthPct(sum(curSales, 'revenue'), prevRevenue),
    ordersGrowth:     growthPct(sum(curSales, 'quantity'), prevOrders),
    usersGrowth:      growthPct(activeUsers, sum(previous, 'users')),
    conversionGrowth: 0,
    profitGrowth:     growthPct(sum(curSales, 'profit'), prevProfit),
  };
};

// ─────────────────────────────────────────────────────────────
// NUMBER FORMATTING
// ─────────────────────────────────────────────────────────────

export const formatCurrency = (value: number): string => {
  if (value >= 1_000_000) return `₹${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value.toFixed(2)}`;
};

export const formatNumber = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
};

export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

// ─────────────────────────────────────────────────────────────
// DATE UTILITIES
// ─────────────────────────────────────────────────────────────

export const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return iso;
  }
};

export const toISODate = (date: Date): string => date.toISOString().split('T')[0];

export const subtractDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
};

// ─────────────────────────────────────────────────────────────
// SORTING
// ─────────────────────────────────────────────────────────────

export const sortRows = (
  rows: DataRow[],
  column: string,
  direction: 'asc' | 'desc'
): DataRow[] => {
  const sorted = [...rows].sort((a, b) => {
    const av = a[column as keyof DataRow];
    const bv = b[column as keyof DataRow];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return String(av).localeCompare(String(bv));
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
};

// ─────────────────────────────────────────────────────────────
// CSS CLASS HELPER
// ─────────────────────────────────────────────────────────────

export const clsx = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

// ─────────────────────────────────────────────────────────────
// STATUS / DELIVERY BADGE COLORS
// ─────────────────────────────────────────────────────────────

export const statusColor = (status: DataRow['status']): string => {
  const map: Record<DataRow['status'], string> = {
    active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    inactive:  'bg-slate-100 text-slate-600 border-slate-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[status] ?? map.inactive;
};

/** Color badge for delivery status from logistics sheet */
export const deliveryStatusColor = (ds: string): string => {
  const map: Record<string, string> = {
    'Delivered':  'bg-emerald-50 text-emerald-700 border-emerald-200',
    'In Transit': 'bg-amber-50 text-amber-700 border-amber-200',
    'Delayed':    'bg-red-50 text-red-700 border-red-200',
  };
  return map[ds] ?? 'bg-slate-100 text-slate-600 border-slate-200';
};

// ─────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────

export const paginate = <T>(items: T[], page: number, pageSize: number): T[] =>
  items.slice((page - 1) * pageSize, page * pageSize);

export const totalPages = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / pageSize));
