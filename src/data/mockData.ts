import type { DataRow } from '../types';

// ─────────────────────────────────────────────────────────────
// MOCK DATA — mirrors your real Google Sheets schema
// Sales sheet:     Order Date, Product Name, Category, Region, Quantity, Sales, Profit
// Logistics sheet: Order ID, Order Date, Product Name, Region, Delivery Status, Warehouse, Delivery Time, Shipping Cost
// ─────────────────────────────────────────────────────────────

const CATEGORIES = ['Electronics', 'Office', 'Accessories', 'Furniture', 'Stationery'];
const PRODUCTS   = ['Laptop', 'Printer', 'Mouse', 'Tablet', 'Keyboard', 'Monitor', 'Desk Chair', 'Webcam'];
const REGIONS    = ['North', 'South', 'East', 'West', 'Central'];
const WAREHOUSES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai'];
const DELIVERY_STATUSES: DataRow['deliveryStatus'][] = ['Delivered', 'In Transit', 'Delayed'];

const seededRng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
};

const rng = seededRng(42);
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

const isoDate = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const generateRows = (count = 200): DataRow[] => {
  const rows: DataRow[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysBack = Math.floor(rng() * 730); // ~2 years
    const d = new Date(now);
    d.setDate(d.getDate() - daysBack);

    const revenue      = Math.round((rng() * 8000 + 500) * 100) / 100;
    const profit       = Math.round(revenue * (0.1 + rng() * 0.35) * 100) / 100;
    const quantity     = Math.floor(rng() * 10) + 1;
    const deliveryTime = Math.floor(rng() * 8) + 1;
    const shippingCost = Math.round((rng() * 300 + 50) * 100) / 100;
    const deliveryStatus = pick(DELIVERY_STATUSES);

    const statusMap: Record<string, DataRow['status']> = {
      'Delivered':  'completed',
      'In Transit': 'pending',
      'Delayed':    'cancelled',
    };

    rows.push({
      id:             `ORD-${String(1000 + i + 1)}`,
      date:           isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      revenue,
      profit,
      quantity,
      orders:         quantity,
      users:          0,
      category:       pick(CATEGORIES),
      product:        pick(PRODUCTS),
      region:         pick(REGIONS),
      deliveryStatus,
      warehouse:      pick(WAREHOUSES),
      deliveryTime,
      shippingCost,
      status:         statusMap[deliveryStatus as string] ?? 'active',
      conversionRate: 0,
      source:         'mock',
    });
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date));
};

export const mockData: DataRow[] = generateRows(200);

// ── Chart Aggregations ────────────────────────────────────────

/** Monthly revenue + profit trend */
export const aggregateByMonth = (rows: DataRow[]) => {
  const map = new Map<string, { revenue: number; profit: number; orders: number; users: number; label: string }>();

  rows.forEach(row => {
    const d = new Date(row.date);
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    const ex    = map.get(key) ?? { revenue: 0, profit: 0, orders: 0, users: 0, label };
    map.set(key, {
      revenue: ex.revenue + (row.revenue || 0),
      profit:  ex.profit  + (row.profit  || 0),
      orders:  ex.orders  + (row.quantity || 0),
      users:   ex.users,
      label,
    });
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, v]) => ({ month: v.label, revenue: v.revenue, profit: v.profit, orders: v.orders, users: v.users }));
};

/** Revenue by category for pie chart */
export const aggregateByCategory = (rows: DataRow[]) => {
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316'];
  const map = new Map<string, number>();
  rows.forEach(r => map.set(r.category, (map.get(r.category) ?? 0) + r.revenue));
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value: Math.round(value), color: COLORS[i % COLORS.length] }));
};

/** Revenue by region — current vs previous half, relative to dataset's own date range.
 *  Uses the latest date IN the data as "now" so historical datasets always show data.
 */
export const aggregateByRegion = (rows: DataRow[]) => {
  // Only rows that have both a region and revenue
  const valid = rows.filter(r => r.region && r.revenue > 0 && r.date);
  if (valid.length === 0) return [];

  // Use dataset's own latest date as reference — not today
  const latestMs = Math.max(...valid.map(r => new Date(r.date).getTime()));

  // Split dataset in half: second half = "current", first half = "previous"
  const earliestMs = Math.min(...valid.map(r => new Date(r.date).getTime()));
  const midMs      = (latestMs + earliestMs) / 2;
  const mid        = new Date(midMs);

  const current  = new Map<string, number>();
  const previous = new Map<string, number>();

  valid.forEach(row => {
    const d = new Date(row.date);
    const region = row.region!;
    if (d > mid) {
      current.set(region, (current.get(region) ?? 0) + row.revenue);
    } else {
      previous.set(region, (previous.get(region) ?? 0) + row.revenue);
    }
  });

  const regions = Array.from(new Set([...current.keys(), ...previous.keys()])).sort();
  return regions.map(name => ({
    name,
    current:  Math.round(current.get(name)  ?? 0),
    previous: Math.round(previous.get(name) ?? 0),
  }));
};

/** Revenue by warehouse — same current vs previous logic */
export const aggregateByWarehouse = (rows: DataRow[]) => {
  const valid = rows.filter(r => r.warehouse && r.revenue > 0 && r.date);
  if (valid.length === 0) return [];

  const latestMs   = Math.max(...valid.map(r => new Date(r.date).getTime()));
  const earliestMs = Math.min(...valid.map(r => new Date(r.date).getTime()));
  const midMs      = (latestMs + earliestMs) / 2;

  const current  = new Map<string, number>();
  const previous = new Map<string, number>();

  valid.forEach(row => {
    const d         = new Date(row.date);
    const warehouse = row.warehouse!;
    if (d.getTime() > midMs) {
      current.set(warehouse, (current.get(warehouse) ?? 0) + row.revenue);
    } else {
      previous.set(warehouse, (previous.get(warehouse) ?? 0) + row.revenue);
    }
  });

  const warehouses = Array.from(new Set([...current.keys(), ...previous.keys()])).sort();
  return warehouses.map(name => ({
    name,
    current:  Math.round(current.get(name)  ?? 0),
    previous: Math.round(previous.get(name) ?? 0),
  }));
};

/** Delivery status distribution for donut chart */
export const aggregateByStatus = (rows: DataRow[]) => {
  const STATUS_COLORS: Record<string, string> = {
    'Delivered':  '#10b981',
    'In Transit': '#f59e0b',
    'Delayed':    '#ef4444',
    // legacy fallbacks
    completed:    '#10b981',
    pending:      '#f59e0b',
    cancelled:    '#ef4444',
    active:       '#6366f1',
    inactive:     '#94a3b8',
  };

  const map = new Map<string, number>();

  rows.forEach(row => {
    // Prefer deliveryStatus if available (logistics sheet), else fall back to status
    const key = row.deliveryStatus ?? row.status;
    map.set(key, (map.get(key) ?? 0) + 1);
  });

  return Array.from(map.entries()).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name] ?? '#94a3b8',
  }));
};

/** Profit margin by category */
export const aggregateProfitByCategory = (rows: DataRow[]) => {
  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4'];
  const map = new Map<string, number>();
  rows.forEach(r => map.set(r.category, (map.get(r.category) ?? 0) + r.profit));
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value: Math.round(value), color: COLORS[i % COLORS.length] }));
};
