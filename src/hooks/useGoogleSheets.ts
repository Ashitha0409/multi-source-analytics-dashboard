import { useEffect, useCallback } from 'react';
import { fetchAllSheets } from '../services/googleSheets';
import { useDashboardStore } from '../store/dashboardStore';

export const useGoogleSheets = () => {
  const {
    sheetsLoading,
    sheetsError,
    sheetsData,
    sheetConfigs,
    setSheetsData,
    setSheetsLoading,
    setSheetsError,
    updateDataSource,
    rebuildData,
  } = useDashboardStore();

  const fetchData = useCallback(async () => {
    setSheetsLoading('loading');
    setSheetsError(null);

    sheetConfigs.forEach((_, i) => {
      updateDataSource(`sheets-${i}`, { status: 'loading' });
    });

    try {
      const results = await fetchAllSheets(sheetConfigs);
      const allRows = results.flatMap(r => r.rows);
      const hasAnyData = allRows.length > 0;

      results.forEach((result, i) => {
        updateDataSource(`sheets-${i}`, {
          status: result.error ? 'error' : 'success',
          rowCount: result.rows.length,
          lastUpdated: new Date().toISOString(),
          ...(result.error ? { error: { message: result.error, source: result.name } } : {}),
        });
      });

      setSheetsData(allRows);
      setSheetsLoading(hasAnyData ? 'success' : 'error');

      const firstError = results.find(r => r.error);
      if (firstError) {
        setSheetsError({ message: firstError.error!, source: firstError.name });
      }
    } catch (err) {
      const message = (err as Error)?.message ?? 'Failed to fetch Google Sheets';
      setSheetsLoading('error');
      setSheetsError({ message });
      sheetConfigs.forEach((_, i) => {
        updateDataSource(`sheets-${i}`, { status: 'error', error: { message } });
      });
    } finally {
      rebuildData();
    }
  }, [setSheetsData, setSheetsLoading, setSheetsError, updateDataSource, rebuildData, sheetConfigs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { sheetsLoading, sheetsError, sheetsData, refetch: fetchData };
};



