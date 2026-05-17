import { useMemo } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { computeKPIs, sortRows, paginate } from '../utils';
import {
  aggregateByMonth,
  aggregateByCategory,
  aggregateByRegion,
  aggregateByWarehouse,
  aggregateByStatus,
  aggregateProfitByCategory,
} from '../data/mockData';

export const useAnalytics = () => {
  const { filteredRows, allRows, tableSort, pagination } = useDashboardStore();

  const kpis               = useMemo(() => computeKPIs(filteredRows),            [filteredRows]);
  const monthlyData        = useMemo(() => aggregateByMonth(filteredRows),        [filteredRows]);
  const categoryData       = useMemo(() => aggregateByCategory(filteredRows),     [filteredRows]);
  const regionData         = useMemo(() => aggregateByRegion(filteredRows),       [filteredRows]);
  const warehouseData      = useMemo(() => aggregateByWarehouse(filteredRows),    [filteredRows]);
  const statusData         = useMemo(() => aggregateByStatus(filteredRows),       [filteredRows]);
  const profitByCategoryData = useMemo(() => aggregateProfitByCategory(filteredRows), [filteredRows]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, tableSort.column as string, tableSort.direction),
    [filteredRows, tableSort]
  );
  const pagedRows = useMemo(
    () => paginate(sortedRows, pagination.page, pagination.pageSize),
    [sortedRows, pagination.page, pagination.pageSize]
  );

  // ── Available filter options (from full dataset, not filtered) ──

  const availableCategories = useMemo(
    () => [...new Set(allRows.map(r => r.category).filter(Boolean))].sort(),
    [allRows]
  );

  // Products grouped by category — { Electronics: ['Laptop', 'Monitor', ...], ... }
  const productsByCategory = useMemo(() => {
    const map = new Map<string, Set<string>>();
    allRows.forEach(r => {
      if (!r.product) return;
      if (!map.has(r.category)) map.set(r.category, new Set());
      map.get(r.category)!.add(r.product);
    });
    const result: Record<string, string[]> = {};
    map.forEach((products, cat) => {
      result[cat] = [...products].sort();
    });
    return result;
  }, [allRows]);

  const availableRegions = useMemo(
    () => [...new Set(allRows.map(r => r.region).filter((r): r is string => !!r))].sort(),
    [allRows]
  );

  const availableWarehouses = useMemo(
    () => [...new Set(allRows.map(r => r.warehouse).filter((w): w is string => !!w))].sort(),
    [allRows]
  );

  const availableStatuses = useMemo(
    () => [...new Set(allRows.map(r => r.status))].sort(),
    [allRows]
  );

  return {
    kpis,
    monthlyData,
    categoryData,
    regionData,
    warehouseData,
    statusData,
    profitByCategoryData,
    sortedRows,
    pagedRows,
    availableCategories,
    productsByCategory,
    availableRegions,
    availableWarehouses,
    availableStatuses,
  };
};
