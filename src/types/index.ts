// ============================================================
// CORE DATA TYPES
// ============================================================

/** Normalized row shape used throughout the dashboard */
export interface DataRow {
  id: string;
  date: string;             // ISO date string

  // ── Sales sheet fields ──────────────────────────────────
  revenue: number;          // mapped from "Sales"
  profit: number;           // mapped from "Profit"
  quantity: number;         // mapped from "Quantity"
  orders: number;           // alias for quantity (kept for KPI compat)
  category: string;         // mapped from "Category"
  product?: string;         // mapped from "Product Name"
  region?: string;          // mapped from "Region"

  // ── Logistics / users sheet fields ──────────────────────
  deliveryStatus?: 'Delivered' | 'In Transit' | 'Delayed' | string;
  warehouse?: string;       // mapped from "Warehouse"
  deliveryTime?: number;    // mapped from "Delivery Time (Days)"
  shippingCost?: number;    // mapped from "Shipping Cost (₹)"

  // ── Legacy / computed ───────────────────────────────────
  users: number;
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';
  conversionRate?: number;
  source?: 'google_sheets' | 'csv' | 'excel' | 'mock';
  isDuplicate?: boolean;
  duplicateOf?: string;
  [key: string]: unknown;
}

/** KPI summary computed from DataRow[] */
export interface KPIData {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  avgDeliveryTime: number;
  totalShippingCost: number;

  // Delivery time buckets
  fastDeliveries: number;    // ≤ 2 days
  normalDeliveries: number;  // 3–5 days
  slowDeliveries: number;    // > 5 days
  logisticsCount: number;    // total rows with logistics data

  // kept for chart compat
  ordersCount: number;
  activeUsers: number;
  conversionRate: number;

  revenueGrowth: number;
  ordersGrowth: number;
  usersGrowth: number;
  conversionGrowth: number;
  profitGrowth: number;
}

/** Monthly aggregated data for charts */
export interface MonthlyData {
  month: string;
  revenue: number;
  profit: number;
  orders: number;
  users: number;
}

/** Category breakdown for pie chart */
export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

/** Bar chart comparison data */
export interface ComparisonData {
  name: string;
  current: number;
  previous: number;
}

// ============================================================
// FILTER TYPES
// ============================================================
export interface FilterState {
  dateRange: { start: string; end: string };
  categories: string[];
  products: string[];      // sub-filter: shown when a category is selected
  statuses: string[];
  regions: string[];       // filter by region
  warehouses: string[];    // filter by warehouse
  sources: string[];
  searchQuery: string;
}

// ============================================================
// UPLOAD / IMPORT TYPES
// ============================================================
export interface UploadedFile {
  id: string;
  name: string;
  type: 'csv' | 'excel';
  uploadedAt: string;
  rowCount: number;
  columns: string[];
  data: DataRow[];
  hasDuplicates: boolean;
  duplicateCount: number;
  merged: boolean;
}

export interface ColumnMapping {
  source: string;
  target: keyof DataRow;
}

// ============================================================
// GOOGLE SHEETS TYPES
// ============================================================
export interface GoogleSheetConfig {
  id: string;
  range: string;
  name: string;
}

export interface GoogleSheetsResponse {
  values: string[][];
  range: string;
  majorDimension: string;
}

// ============================================================
// API / STATE TYPES
// ============================================================
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiError {
  message: string;
  code?: string | number;
  source?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'google_sheets' | 'csv' | 'excel' | 'mock';
  status: LoadingState;
  error?: ApiError;
  rowCount: number;
  lastUpdated?: string;
}

// ============================================================
// TABLE TYPES
// ============================================================
export type SortDirection = 'asc' | 'desc';

export interface TableSort {
  column: keyof DataRow | string;
  direction: SortDirection;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// ============================================================
// NAVIGATION TYPES
// ============================================================
export type PageId = 'dashboard' | 'analytics' | 'data' | 'upload' | 'settings';

export interface NavItem {
  id: PageId;
  label: string;
  icon: string;
  badge?: number;
}
