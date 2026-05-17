import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { DataRow, UploadedFile } from '../types';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Generate a unique ID using native browser crypto API */
const genId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().split('-')[0].toUpperCase()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

const VALID_STATUSES = new Set(['active', 'inactive', 'pending', 'completed', 'cancelled']);

/**
 * Normalize a raw object (from CSV/Excel) into our DataRow schema.
 * Handles missing/null values safely.
 */
const normalizeRawRow = (raw: Record<string, unknown>, index: number, fileId: string): DataRow => {
  // Try common aliases for each field
  const get = (...keys: string[]): string => {
    for (const k of keys) {
      const found = Object.entries(raw).find(
        ([key]) => key.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase().replace(/[\s_-]/g, '')
      );
      if (found && found[1] != null && String(found[1]).trim() !== '') {
        return String(found[1]).trim();
      }
    }
    return '';
  };

  const rawDate = get('date', 'created_at', 'createdAt', 'order_date', 'timestamp', 'Date');
  let date: string;
  try {
    const d = new Date(rawDate);
    date = isNaN(d.getTime())
      ? new Date().toISOString().split('T')[0]
      : d.toISOString().split('T')[0];
  } catch {
    date = new Date().toISOString().split('T')[0];
  }

  const rawStatus = get('status', 'state', 'Status').toLowerCase();
  const status = VALID_STATUSES.has(rawStatus)
    ? (rawStatus as DataRow['status'])
    : 'active';

  return {
    id:             get('id', 'order_id', 'orderId', 'transaction_id') || `${fileId}-${index + 1}`,
    date,
    revenue:        parseFloat(get('revenue', 'amount', 'total', 'sales', 'Revenue') || '0') || 0,
    profit:         parseFloat(get('profit', 'net_profit', 'margin', 'Profit') || '0') || 0,
    quantity:       parseInt(get('quantity', 'qty', 'units', 'Quantity') || '0', 10) || 0,
    orders:         parseInt(get('orders', 'order_count', 'quantity', 'Orders') || '0', 10) || 0,
    users:          parseInt(get('users', 'user_count', 'customers', 'Users') || '0', 10) || 0,
    category:       get('category', 'cat', 'type', 'segment', 'Category') || 'Uncategorized',
    status,
    product:        get('product', 'product_name', 'item', 'sku') || undefined,
    region:         get('region', 'location', 'country', 'area') || undefined,
    deliveryStatus: get('delivery_status', 'deliveryStatus', 'Delivery Status') || undefined,
    warehouse:      get('warehouse', 'Warehouse') || undefined,
    deliveryTime:   parseInt(get('delivery_time', 'deliveryTime', 'Delivery Time (Days)') || '0', 10) || undefined,
    shippingCost:   parseFloat(get('shipping_cost', 'shippingCost', 'Shipping Cost (₹)') || '0') || undefined,
    conversionRate: parseFloat(get('conversion_rate', 'conversionRate', 'cvr') || '0') || 0,
    source:         'csv',
  };
};

/** Detect duplicate IDs in a set of rows */
const detectDuplicates = (rows: DataRow[]): { hasDuplicates: boolean; duplicateCount: number } => {
  const seen = new Set<string>();
  let duplicateCount = 0;
  rows.forEach(r => {
    if (seen.has(r.id)) duplicateCount++;
    else seen.add(r.id);
  });
  return { hasDuplicates: duplicateCount > 0, duplicateCount };
};

// ─────────────────────────────────────────────────────────────
// CSV PARSER
// ─────────────────────────────────────────────────────────────

export const parseCSV = (file: File): Promise<UploadedFile> =>
  new Promise((resolve, reject) => {
    const fileId = genId();

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // keep as strings for safe parsing
      complete: result => {
        if (result.errors.length > 0 && result.data.length === 0) {
          reject(new Error(`CSV parse failed: ${result.errors[0]?.message}`));
          return;
        }

        const columns = result.meta.fields ?? [];
        const rows = result.data.map((raw, i) => normalizeRawRow(raw, i, fileId));
        const { hasDuplicates, duplicateCount } = detectDuplicates(rows);

        resolve({
          id: fileId,
          name: file.name,
          type: 'csv',
          uploadedAt: new Date().toISOString(),
          rowCount: rows.length,
          columns,
          data: rows,
          hasDuplicates,
          duplicateCount,
          merged: false,
        });
      },
      error: err => reject(new Error(`CSV parse error: ${err.message}`)),
    });
  });

// ─────────────────────────────────────────────────────────────
// EXCEL PARSER
// ─────────────────────────────────────────────────────────────

export const parseExcel = (file: File): Promise<UploadedFile> =>
  new Promise((resolve, reject) => {
    const fileId = genId();
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const data = new Uint8Array(event.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Use first sheet by default
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('Excel file contains no sheets');

        const sheet = workbook.Sheets[sheetName];
        const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
          raw: false,        // convert to strings for consistent parsing
          defval: '',        // default value for empty cells
        });

        const columns = rawData.length > 0 ? Object.keys(rawData[0]) : [];
        const rows = rawData.map((raw, i) => normalizeRawRow(raw, i, fileId));
        const { hasDuplicates, duplicateCount } = detectDuplicates(rows);

        resolve({
          id: fileId,
          name: file.name,
          type: 'excel',
          uploadedAt: new Date().toISOString(),
          rowCount: rows.length,
          columns,
          data: rows,
          hasDuplicates,
          duplicateCount,
          merged: false,
        });
      } catch (err) {
        reject(new Error(`Excel parse error: ${(err as Error).message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });

// ─────────────────────────────────────────────────────────────
// UNIFIED PARSER
// ─────────────────────────────────────────────────────────────

export const parseFile = (file: File): Promise<UploadedFile> => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return parseCSV(file);
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file);
  return Promise.reject(new Error(`Unsupported file type: .${ext}`));
};



