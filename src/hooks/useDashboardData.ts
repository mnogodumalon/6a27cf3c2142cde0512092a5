import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Zutaten, ApfelstrudelVarianten } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [zutaten, setZutaten] = useState<Zutaten[]>([]);
  const [apfelstrudelVarianten, setApfelstrudelVarianten] = useState<ApfelstrudelVarianten[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [zutatenData, apfelstrudelVariantenData] = await Promise.all([
        LivingAppsService.getZutaten(),
        LivingAppsService.getApfelstrudelVarianten(),
      ]);
      setZutaten(zutatenData);
      setApfelstrudelVarianten(apfelstrudelVariantenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [zutatenData, apfelstrudelVariantenData] = await Promise.all([
          LivingAppsService.getZutaten(),
          LivingAppsService.getApfelstrudelVarianten(),
        ]);
        setZutaten(zutatenData);
        setApfelstrudelVarianten(apfelstrudelVariantenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const zutatenMap = useMemo(() => {
    const m = new Map<string, Zutaten>();
    zutaten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [zutaten]);

  return { zutaten, setZutaten, apfelstrudelVarianten, setApfelstrudelVarianten, loading, error, fetchAll, zutatenMap };
}