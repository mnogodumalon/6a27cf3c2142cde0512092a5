import type { EnrichedApfelstrudelVarianten } from '@/types/enriched';
import type { ApfelstrudelVarianten, Zutaten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface ApfelstrudelVariantenMaps {
  zutatenMap: Map<string, Zutaten>;
}

export function enrichApfelstrudelVarianten(
  apfelstrudelVarianten: ApfelstrudelVarianten[],
  maps: ApfelstrudelVariantenMaps
): EnrichedApfelstrudelVarianten[] {
  return apfelstrudelVarianten.map(r => ({
    ...r,
    verwendete_zutatenName: resolveDisplay(r.fields.verwendete_zutaten, maps.zutatenMap, 'marke_hersteller'),
  }));
}
