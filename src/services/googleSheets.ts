import axios from 'axios';
import type { DataRow, GoogleSheetConfig } from '../types';

// ─────────────────────────────────────────────────────────────
// SHEET CONFIGURATION
// sales tab  → Order Date, Product Name, Category, Region, Quantity, Sales, Profit
// user tab   → Order ID, Order Date, Product Name, Region, Delivery Status, Warehouse, Delivery Time (Days), Shipping Cost (₹)
// ─────────────────────────────────────────────────────────────

export const DEFAULT_SHEET_CONFIGS: GoogleSheetConfig[] = [
  {
    id: import.meta.env.VITE_SHEET_ID_SALES || '10l2WDcZDqRhvwYyoTwggVHMsOlCMzCgqUc8FUo3NhG0',
    range: 'sales',
    name: 'Sales Data',
  },
  {
    id: import.meta.env.VITE_SHEET_ID_SALES || '10l2WDcZDqRhvwYyoTwggVHMsOlCMzCgqUc8FUo3NhG0',
    range: 'user',
    name: 'Logistics',
  },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const normalizeHeader = (h: string) =>
  h.toLowerCase().replace(/[_\s]+/g, ' ').trim();

const parseDate = (raw: string): string => {
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? new Date().toISOString().split('T')[0]
    : d.toISOString().split('T')[0];
};

const DELIVERY_STATUS_MAP: Record<string, string> = {
  'delivered':  'Delivered',
  'in transit': 'In Transit',
  'intransit':  'In Transit',
  'delayed':    'Delayed',
  'pending':    'In Transit',
  'shipped':    'In Transit',
};

const normalizeDeliveryStatus = (raw: string): string =>
  DELIVERY_STATUS_MAP[raw.toLowerCase().trim()] ?? raw;

// ─────────────────────────────────────────────────────────────
// SALES SHEET PARSER
// Columns: Order Date | Product Name | Category | Region | Quantity | Sales | Profit
// No Order ID — join key = date + product + region
// ─────────────────────────────────────────────────────────────

interface SalesRow {
  joinKey: string;   // date|product|region
  date: string;
  product: string;
  category: string;
  region: string;
  quantity: number;
  revenue: number;
  profit: number;
}

const parseSalesSheet = (values: string[][]): SalesRow[] => {
  const headers = values[0].map(normalizeHeader);
  const col = (name: string) => headers.indexOf(name);

  // Map flexible header names
  const dateIdx     = col('order date')    !== -1 ? col('order date')    : col('date');
  const productIdx  = col('product name')  !== -1 ? col('product name')  : col('product');
  const categoryIdx = col('category');
  const regionIdx   = col('region');
  const qtyIdx      = col('quantity');
  const salesIdx    = col('sales')         !== -1 ? col('sales')         : col('revenue');
  const profitIdx   = col('profit');

  return values.slice(1)
    .filter(row => row.some(c => c?.trim()))
    .map(row => {
      const date    = parseDate(row[dateIdx]    ?? '');
      const product = (row[productIdx]  ?? '').trim();
      const region  = (row[regionIdx]   ?? '').trim();
      return {
        joinKey:  `${date}|${product.toLowerCase()}|${region.toLowerCase()}`,
        date,
        product,
        category: (row[categoryIdx] ?? 'Uncategorized').trim(),
        region,
        quantity: parseInt(row[qtyIdx]    ?? '0', 10) || 0,
        revenue:  parseFloat(row[salesIdx]  ?? '0') || 0,
        profit:   parseFloat(row[profitIdx] ?? '0') || 0,
      };
    });
};

// ─────────────────────────────────────────────────────────────
// LOGISTICS SHEET PARSER
// Columns: Order ID | Order Date | Product Name | Region | Delivery Status | Warehouse | Delivery Time (Days) | Shipping Cost (₹)
// ─────────────────────────────────────────────────────────────

interface LogisticsRow {
  joinKey: string;
  orderId: string;
  deliveryStatus: string;
  warehouse: string;
  deliveryTime: number;
  shippingCost: number;
}

const parseLogisticsSheet = (values: string[][]): LogisticsRow[] => {
  const headers = values[0].map(normalizeHeader);
  const col = (name: string) => headers.indexOf(name);

  const orderIdIdx   = col('order id')              !== -1 ? col('order id')              : 0;
  const dateIdx      = col('order date')             !== -1 ? col('order date')             : col('date');
  const productIdx   = col('product name')           !== -1 ? col('product name')           : col('product');
  const regionIdx    = col('region');
  const statusIdx    = col('delivery status');
  const warehouseIdx = col('warehouse');
  const timeIdx      = col('delivery time (days)')   !== -1 ? col('delivery time (days)')   : col('delivery time');
  const costIdx      = col('shipping cost (₹)')      !== -1 ? col('shipping cost (₹)')      : col('shipping cost');

  return values.slice(1)
    .filter(row => row.some(c => c?.trim()))
    .map(row => {
      const date    = parseDate(row[dateIdx]    ?? '');
      const product = (row[productIdx] ?? '').trim();
      const region  = (row[regionIdx]  ?? '').trim();
      return {
        joinKey:        `${date}|${product.toLowerCase()}|${region.toLowerCase()}`,
        orderId:        (row[orderIdIdx]   ?? '').trim(),
        deliveryStatus: normalizeDeliveryStatus(row[statusIdx]    ?? ''),
        warehouse:      (row[warehouseIdx] ?? '').trim(),
        deliveryTime:   parseInt(row[timeIdx] ?? '0', 10) || 0,
        shippingCost:   parseFloat(row[costIdx] ?? '0') || 0,
      };
    });
};

// ─────────────────────────────────────────────────────────────
// JOIN — merge sales + logistics on date|product|region
// Result: one DataRow per order with ALL fields populated
// ─────────────────────────────────────────────────────────────

const joinSheets = (salesRows: SalesRow[], logisticsRows: LogisticsRow[]): DataRow[] => {
  // Build logistics lookup map
  const logMap = new Map<string, LogisticsRow>();
  logisticsRows.forEach(r => logMap.set(r.joinKey, r));

  const STATUS_MAP: Record<string, DataRow['status']> = {
    'Delivered':  'completed',
    'In Transit': 'pending',
    'Delayed':    'cancelled',
  };

  // For every sales row, find matching logistics row
  const joined: DataRow[] = salesRows.map((s, i) => {
    const log = logMap.get(s.joinKey);
    const deliveryStatus = log?.deliveryStatus || undefined;
    const status: DataRow['status'] = deliveryStatus
      ? (STATUS_MAP[deliveryStatus] ?? 'active')
      : 'completed'; // if no logistics data, assume completed

    return {
      id:             log?.orderId || `SALES-${i + 1}`,
      date:           s.date,
      revenue:        s.revenue,
      profit:         s.profit,
      quantity:       s.quantity,
      orders:         s.quantity,
      users:          0,
      category:       s.category,
      product:        s.product || undefined,
      region:         s.region  || undefined,
      deliveryStatus,
      warehouse:      log?.warehouse   || undefined,
      deliveryTime:   log?.deliveryTime || undefined,
      shippingCost:   log?.shippingCost || undefined,
      status,
      conversionRate: 0,
      source:         'google_sheets',
    };
  });

  // Also add logistics rows that have no matching sales row
  // (orders in transit/delayed that aren't in sales yet)
  const salesKeys = new Set(salesRows.map(s => s.joinKey));
  logisticsRows
    .filter(l => !salesKeys.has(l.joinKey))
    .forEach((l, i) => {
      const deliveryStatus = l.deliveryStatus || undefined;
      const status: DataRow['status'] = deliveryStatus
        ? (STATUS_MAP[deliveryStatus] ?? 'active')
        : 'active';
      joined.push({
        id:             l.orderId || `LOG-${i + 1}`,
        date:           '', // no date from logistics-only row
        revenue:        0,
        profit:         0,
        quantity:       0,
        orders:         0,
        users:          0,
        category:       'Uncategorized',
        product:        undefined,
        region:         undefined,
        deliveryStatus,
        warehouse:      l.warehouse   || undefined,
        deliveryTime:   l.deliveryTime || undefined,
        shippingCost:   l.shippingCost || undefined,
        status,
        conversionRate: 0,
        source:         'google_sheets',
      });
    });

  return joined;
};

// ─────────────────────────────────────────────────────────────
// FETCH A SINGLE SHEET (raw values)
// ─────────────────────────────────────────────────────────────

const fetchRawSheet = async (config: GoogleSheetConfig): Promise<string[][]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('VITE_GOOGLE_SHEETS_API_KEY is missing in your .env file.');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.id}/values/${encodeURIComponent(config.range)}?key=${apiKey}`;

  try {
    const response = await axios.get(url);
    return (response.data.values as string[][]) ?? [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400)
        throw new Error(`Tab "${config.range}" not found — check the exact tab name in your sheet.`);
      if (error.response?.status === 403)
        throw new Error('Invalid API Key or Sheets API not enabled.');
      if (error.response?.status === 404)
        throw new Error('Spreadsheet not found — check the Sheet ID.');
    }
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────
// FETCH ALL SHEETS + JOIN
// ─────────────────────────────────────────────────────────────

export interface SheetFetchResult {
  name: string;
  rows: DataRow[];
  error?: string;
}

export const fetchAllSheets = async (
  configs: GoogleSheetConfig[]
): Promise<SheetFetchResult[]> => {
  const [salesConfig, logisticsConfig] = configs;

  try {
    // Fetch both sheets in parallel
    const [salesValues, logisticsValues] = await Promise.all([
      fetchRawSheet(salesConfig),
      fetchRawSheet(logisticsConfig),
    ]);

    if (salesValues.length < 2 && logisticsValues.length < 2) {
      return [{ name: 'Combined', rows: [] }];
    }

    const salesRows     = salesValues.length >= 2     ? parseSalesSheet(salesValues)         : [];
    const logisticsRows = logisticsValues.length >= 2 ? parseLogisticsSheet(logisticsValues) : [];

    // JOIN the two sheets — every order now has revenue + delivery status
    const joined = joinSheets(salesRows, logisticsRows);

    return [{ name: 'Combined', rows: joined }];

  } catch (err) {
    return [{
      name: 'Combined',
      rows: [],
      error: (err as Error)?.message ?? 'Failed to fetch sheets',
    }];
  }
};

// Keep fetchSheet exported for Settings page compat
export const fetchSheet = fetchRawSheet;
