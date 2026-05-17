import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  DataRow,
  FilterState,
  UploadedFile,
  DataSource,
  TableSort,
  PaginationState,
  PageId,
  LoadingState,
  ApiError,
  GoogleSheetConfig,
} from '../types';
import { mockData } from '../data/mockData';
import { DEFAULT_SHEET_CONFIGS } from '../services/googleSheets';

interface DashboardStore {
  activePage: PageId;
  sidebarOpen: boolean;
  sheetConfigs: GoogleSheetConfig[];
  ignoreDuplicates: boolean;
  sheetsData: DataRow[];
  uploadedRows: DataRow[];
  allRows: DataRow[];
  dataSources: DataSource[];
  uploadedFiles: UploadedFile[];
  sheetsLoading: LoadingState;
  sheetsError: ApiError | null;
  filters: FilterState;
  tableSort: TableSort;
  pagination: PaginationState;
  filteredRows: DataRow[];

  setActivePage: (page: PageId) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSheetConfigs: (configs: GoogleSheetConfig[]) => void;
  setIgnoreDuplicates: (ignore: boolean) => void;
  setSheetsData: (rows: DataRow[]) => void;
  setSheetsLoading: (state: LoadingState) => void;
  setSheetsError: (err: ApiError | null) => void;
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  clearUploadedFiles: () => void;
  toggleFileMerge: (id: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setTableSort: (sort: TableSort) => void;
  setPagination: (p: Partial<PaginationState>) => void;
  rebuildData: () => void;
  updateDataSource: (id: string, update: Partial<DataSource>) => void;
}

const DEFAULT_FILTERS: FilterState = {
  dateRange: { start: '', end: '' },
  categories: [],
  products:   [],
  statuses:   [],
  regions:    [],
  warehouses: [],
  sources:    [],
  searchQuery: '',
};

const DEFAULT_SORT: TableSort = { column: 'date', direction: 'desc' };
const DEFAULT_PAGINATION: PaginationState = { page: 1, pageSize: 15, total: 0 };

const INITIAL_SOURCES: DataSource[] = [
  { id: 'sheets-0', name: 'Sales Data',  type: 'google_sheets', status: 'idle', rowCount: 0 },
  { id: 'sheets-1', name: 'Logistics',   type: 'google_sheets', status: 'idle', rowCount: 0 },
  { id: 'mock',     name: 'Mock Data',   type: 'mock', status: 'success', rowCount: mockData.length, lastUpdated: new Date().toISOString() },
];

const markDuplicates = (rows: DataRow[], ignore: boolean): DataRow[] => {
  const seen = new Map<string, string>();
  return rows.reduce((acc, r) => {
    if (seen.has(r.id)) {
      if (ignore) return acc;
      acc.push({ ...r, isDuplicate: true, duplicateOf: seen.get(r.id) });
    } else {
      seen.set(r.id, r.id);
      acc.push(r);
    }
    return acc;
  }, [] as DataRow[]);
};

const applyFilters = (rows: DataRow[], f: FilterState): DataRow[] => {
  let result = rows;

  if (f.dateRange.start) result = result.filter(r => r.date >= f.dateRange.start);
  if (f.dateRange.end)   result = result.filter(r => r.date <= f.dateRange.end);

  if (f.categories.length > 0)
    result = result.filter(r => f.categories.includes(r.category));

  // Product sub-filter (only active when categories are selected)
  if (f.products.length > 0)
    result = result.filter(r => f.products.includes(r.product ?? ''));

  if (f.statuses.length > 0) {
    const activeStatuses = f.statuses.map(s => s.toLowerCase());
    result = result.filter(r =>
      activeStatuses.includes((r.deliveryStatus ?? '').toLowerCase()) || 
      activeStatuses.includes((r.status ?? '').toLowerCase())
    );
  }

  if (f.regions.length > 0)
    result = result.filter(r => f.regions.includes(r.region ?? ''));

  if (f.warehouses.length > 0)
    result = result.filter(r => f.warehouses.includes(r.warehouse ?? ''));

  if (f.sources.length > 0)
    result = result.filter(r => f.sources.includes(r.source ?? ''));

  if (f.searchQuery.trim()) {
    const q = f.searchQuery.trim().toLowerCase();
    result = result.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      (r.product        ?? '').toLowerCase().includes(q) ||
      (r.region         ?? '').toLowerCase().includes(q) ||
      (r.warehouse      ?? '').toLowerCase().includes(q) ||
      (r.deliveryStatus ?? '').toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  }

  return result;
};

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    persist(
      (set, get) => ({
        activePage: 'dashboard',
        sidebarOpen: true,
        sheetConfigs: DEFAULT_SHEET_CONFIGS,
        ignoreDuplicates: true,

        sheetsData: [],
        uploadedRows: [],
        allRows: mockData,

        dataSources: INITIAL_SOURCES,
        uploadedFiles: [],
        sheetsLoading: 'idle',
        sheetsError: null,

        filters: DEFAULT_FILTERS,
        tableSort: DEFAULT_SORT,
        pagination: { ...DEFAULT_PAGINATION, total: mockData.length },
        filteredRows: mockData,

        setActivePage: page => set({ activePage: page }),
        toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
        setSidebarOpen: open => set({ sidebarOpen: open }),

        setSheetConfigs: configs => { set({ sheetConfigs: configs }); get().rebuildData(); },
        setIgnoreDuplicates: ignore => { set({ ignoreDuplicates: ignore }); get().rebuildData(); },

        setSheetsData:   rows => set({ sheetsData: rows },  false, 'setSheetsData'),
        setSheetsLoading: s   => set({ sheetsLoading: s },  false, 'setSheetsLoading'),
        setSheetsError:  err  => set({ sheetsError: err },  false, 'setSheetsError'),

        addUploadedFile: file => set(s => ({ uploadedFiles: [...s.uploadedFiles, { ...file, merged: false }] }), false, 'addUploadedFile'),
        removeUploadedFile: id => { set(s => ({ uploadedFiles: s.uploadedFiles.filter(f => f.id !== id) }), false, 'removeUploadedFile'); get().rebuildData(); },
        clearUploadedFiles: () => set({ uploadedFiles: [], uploadedRows: [] }, false, 'clearUploadedFiles'),
        toggleFileMerge: id => {
          set(s => ({ uploadedFiles: s.uploadedFiles.map(f => f.id === id ? { ...f, merged: !f.merged } : f) }), false, 'toggleFileMerge');
          get().rebuildData();
        },

        setFilters: partial => { set({ filters: { ...get().filters, ...partial } }, false, 'setFilters'); get().rebuildData(); },
        resetFilters: () => { set({ filters: DEFAULT_FILTERS }, false, 'resetFilters'); get().rebuildData(); },
        setTableSort: sort => set({ tableSort: sort }, false, 'setTableSort'),
        setPagination: p => set(s => ({ pagination: { ...s.pagination, ...p } }), false, 'setPagination'),

        updateDataSource: (id, update) => set(s => ({
          dataSources: s.dataSources.map(ds => ds.id === id ? { ...ds, ...update } : ds),
        }), false, 'updateDataSource'),

        rebuildData: () => {
          const { sheetsData, filters, ignoreDuplicates, uploadedFiles } = get();
          const mergedUploaded = uploadedFiles.filter(f => f.merged).flatMap(f => f.data);
          const rawMerged = [...sheetsData, ...mergedUploaded];
          const deduplicated = markDuplicates(rawMerged, ignoreDuplicates);
          const filtered = applyFilters(deduplicated, filters);
          set({
            allRows: deduplicated,
            filteredRows: filtered,
            pagination: { ...get().pagination, page: 1, total: filtered.length },
          }, false, 'rebuildData');
        },
      }),
      {
        name: 'datapulse-storage-v8',
        partialize: state => ({ sheetConfigs: state.sheetConfigs, ignoreDuplicates: state.ignoreDuplicates }),
      }
    ),
    { name: 'DashboardStore' }
  )
);
