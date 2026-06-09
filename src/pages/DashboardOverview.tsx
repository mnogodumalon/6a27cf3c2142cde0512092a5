import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichApfelstrudelVarianten } from '@/lib/enrich';
import type { EnrichedApfelstrudelVarianten } from '@/types/enriched';
import type { Zutaten } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ApfelstrudelVariantenDialog } from '@/components/dialogs/ApfelstrudelVariantenDialog';
import { ZutatenDialog } from '@/components/dialogs/ZutatenDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconStar, IconStarFilled,
  IconSearch, IconLeaf, IconChefHat, IconFilter,
} from '@tabler/icons-react';

const APPGROUP_ID = '6a27cf3c2142cde0512092a5';
const REPAIR_ENDPOINT = '/claude/build/repair';

const BEWERTUNG_ORDER: Record<string, number> = {
  bewertung_5: 5,
  bewertung_4: 4,
  bewertung_3: 3,
  bewertung_2: 2,
  bewertung_1: 1,
};

function getRatingNum(v: EnrichedApfelstrudelVarianten): number {
  const key = v.fields.bewertung?.key ?? '';
  return BEWERTUNG_ORDER[key] ?? 0;
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) =>
        i < rating
          ? <IconStarFilled key={i} size={14} className="text-amber-400" />
          : <IconStar key={i} size={14} className="text-muted-foreground/40" />
      )}
    </div>
  );
}

const KATEGORIE_COLORS: Record<string, string> = {
  ei: 'bg-yellow-100 text-yellow-800',
  teig: 'bg-amber-100 text-amber-800',
  obst: 'bg-green-100 text-green-800',
  zucker: 'bg-pink-100 text-pink-800',
  gewuerz: 'bg-orange-100 text-orange-800',
  fett: 'bg-blue-100 text-blue-800',
  milchprodukt: 'bg-sky-100 text-sky-800',
  sonstiges: 'bg-gray-100 text-gray-700',
};

export default function DashboardOverview() {
  const {
    zutaten, apfelstrudelVarianten,
    zutatenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedApfelstrudelVarianten = enrichApfelstrudelVarianten(apfelstrudelVarianten, { zutatenMap });

  // Varianten state
  const [varianteSearch, setVarianteSearch] = useState('');
  const [filterBewertung, setFilterBewertung] = useState<string>('alle');
  const [editVariante, setEditVariante] = useState<EnrichedApfelstrudelVarianten | null>(null);
  const [deleteVariante, setDeleteVariante] = useState<EnrichedApfelstrudelVarianten | null>(null);
  const [varianteDialogOpen, setVarianteDialogOpen] = useState(false);

  // Zutaten state
  const [zutatenSearch, setZutatenSearch] = useState('');
  const [filterKategorie, setFilterKategorie] = useState<string>('alle');
  const [editZutat, setEditZutat] = useState<Zutaten | null>(null);
  const [deleteZutat, setDeleteZutat] = useState<Zutaten | null>(null);
  const [zutatenDialogOpen, setZutatenDialogOpen] = useState(false);

  const filteredVarianten = useMemo(() => {
    let list = enrichedApfelstrudelVarianten;
    if (varianteSearch) {
      const q = varianteSearch.toLowerCase();
      list = list.filter(v =>
        v.fields.variante_name?.toLowerCase().includes(q) ||
        v.fields.kommentar?.toLowerCase().includes(q) ||
        v.verwendete_zutatenName?.toLowerCase().includes(q)
      );
    }
    if (filterBewertung !== 'alle') {
      list = list.filter(v => v.fields.bewertung?.key === filterBewertung);
    }
    return [...list].sort((a, b) => getRatingNum(b) - getRatingNum(a));
  }, [enrichedApfelstrudelVarianten, varianteSearch, filterBewertung]);

  const filteredZutaten = useMemo(() => {
    let list = zutaten;
    if (zutatenSearch) {
      const q = zutatenSearch.toLowerCase();
      list = list.filter(z =>
        z.fields.produkt_name?.toLowerCase().includes(q) ||
        z.fields.marke_hersteller?.toLowerCase().includes(q) ||
        z.fields.bezugsquelle?.toLowerCase().includes(q)
      );
    }
    if (filterKategorie !== 'alle') {
      list = list.filter(z => z.fields.kategorie?.key === filterKategorie);
    }
    return list;
  }, [zutaten, zutatenSearch, filterKategorie]);

  const topVariante = useMemo(() =>
    [...enrichedApfelstrudelVarianten].sort((a, b) => getRatingNum(b) - getRatingNum(a))[0],
    [enrichedApfelstrudelVarianten]
  );

  const avgRating = useMemo(() => {
    if (!enrichedApfelstrudelVarianten.length) return 0;
    const sum = enrichedApfelstrudelVarianten.reduce((s, v) => s + getRatingNum(v), 0);
    return Math.round((sum / enrichedApfelstrudelVarianten.length) * 10) / 10;
  }, [enrichedApfelstrudelVarianten]);

  const kategorienCount = useMemo(() => {
    const set = new Set(zutaten.map(z => z.fields.kategorie?.key).filter(Boolean));
    return set.size;
  }, [zutaten]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-8 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Apfelstrudel-Werkstatt</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Varianten testen, bewerten und Zutaten verwalten</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Varianten"
          value={String(enrichedApfelstrudelVarianten.length)}
          description="erfasst"
          icon={<IconChefHat size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Ø Bewertung"
          value={avgRating > 0 ? `${avgRating}/5` : '–'}
          description="Durchschnitt"
          icon={<IconStarFilled size={18} className="text-amber-400" />}
        />
        <StatCard
          title="Zutaten"
          value={String(zutaten.length)}
          description="in der Bibliothek"
          icon={<IconLeaf size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Kategorien"
          value={String(kategorienCount)}
          description="verschiedene"
          icon={<IconFilter size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Best Variante Highlight */}
      {topVariante && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 lg:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <IconStarFilled size={24} className="text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-0.5">Beste Variante</p>
            <p className="font-bold text-lg text-foreground truncate">{topVariante.fields.variante_name ?? '(ohne Name)'}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <StarRating rating={getRatingNum(topVariante)} />
              {topVariante.fields.datum_zubereitung && (
                <span className="text-xs text-muted-foreground">{formatDate(topVariante.fields.datum_zubereitung)}</span>
              )}
              {topVariante.verwendete_zutatenName && (
                <span className="text-xs text-muted-foreground">Zutat: {topVariante.verwendete_zutatenName}</span>
              )}
            </div>
            {topVariante.fields.kommentar && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{topVariante.fields.kommentar}</p>
            )}
          </div>
        </div>
      )}

      {/* Varianten Section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Strudel-Varianten</h2>
          <Button
            size="sm"
            onClick={() => { setEditVariante(null); setVarianteDialogOpen(true); }}
          >
            <IconPlus size={15} className="mr-1.5 shrink-0" />
            Neue Variante
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={varianteSearch}
              onChange={e => setVarianteSearch(e.target.value)}
              placeholder="Variante suchen…"
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['alle', 'bewertung_5', 'bewertung_4', 'bewertung_3', 'bewertung_2', 'bewertung_1'].map(key => (
              <button
                key={key}
                onClick={() => setFilterBewertung(key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterBewertung === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {key === 'alle' ? 'Alle' : `${'★'.repeat(BEWERTUNG_ORDER[key] ?? 0)}`}
              </button>
            ))}
          </div>
        </div>

        {filteredVarianten.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border">
            <IconChefHat size={40} className="text-muted-foreground mb-3" stroke={1.5} />
            <p className="text-sm text-muted-foreground">Noch keine Varianten erfasst</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => { setEditVariante(null); setVarianteDialogOpen(true); }}
            >
              <IconPlus size={14} className="mr-1" /> Erste Variante anlegen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredVarianten.map(v => (
              <div
                key={v.record_id}
                className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{v.fields.variante_name ?? '(ohne Name)'}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <StarRating rating={getRatingNum(v)} />
                      {v.fields.bewertung && (
                        <span className="text-xs text-muted-foreground">{v.fields.bewertung.label}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditVariante(v); setVarianteDialogOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Bearbeiten"
                    >
                      <IconPencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteVariante(v)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Löschen"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>

                {v.verwendete_zutatenName && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      <IconLeaf size={11} />
                      {v.verwendete_zutatenName}
                    </span>
                  </div>
                )}

                {v.fields.kommentar && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{v.fields.kommentar}</p>
                )}

                {v.fields.datum_zubereitung && (
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(v.fields.datum_zubereitung)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Zutaten Section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Zutaten-Bibliothek</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setEditZutat(null); setZutatenDialogOpen(true); }}
          >
            <IconPlus size={15} className="mr-1.5 shrink-0" />
            Neue Zutat
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={zutatenSearch}
              onChange={e => setZutatenSearch(e.target.value)}
              placeholder="Zutat suchen…"
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['alle', 'ei', 'teig', 'obst', 'zucker', 'gewuerz', 'fett', 'milchprodukt', 'sonstiges'].map(key => (
              <button
                key={key}
                onClick={() => setFilterKategorie(key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterKategorie === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {key === 'alle' ? 'Alle' : ({
                  ei: 'Ei', teig: 'Teig', obst: 'Obst', zucker: 'Zucker', gewuerz: 'Gewürz',
                  fett: 'Fett & Öl', milchprodukt: 'Milchprodukt', sonstiges: 'Sonstiges'
                })[key] ?? key}
              </button>
            ))}
          </div>
        </div>

        {filteredZutaten.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border">
            <IconLeaf size={40} className="text-muted-foreground mb-3" stroke={1.5} />
            <p className="text-sm text-muted-foreground">Keine Zutaten gefunden</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => { setEditZutat(null); setZutatenDialogOpen(true); }}
            >
              <IconPlus size={14} className="mr-1" /> Erste Zutat anlegen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredZutaten.map(z => (
              <div
                key={z.record_id}
                className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{z.fields.produkt_name ?? '(ohne Name)'}</p>
                    {z.fields.kategorie && (
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${KATEGORIE_COLORS[z.fields.kategorie.key] ?? 'bg-gray-100 text-gray-700'}`}>
                        {z.fields.kategorie.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditZutat(z); setZutatenDialogOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Bearbeiten"
                    >
                      <IconPencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteZutat(z)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Löschen"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>

                {z.fields.marke_hersteller && (
                  <p className="text-xs text-muted-foreground mt-2 truncate">{z.fields.marke_hersteller}</p>
                )}
                {z.fields.bezugsquelle && (
                  <p className="text-xs text-muted-foreground truncate">{z.fields.bezugsquelle}</p>
                )}
                {z.fields.notizen_zutat && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{z.fields.notizen_zutat}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dialogs */}
      <ApfelstrudelVariantenDialog
        open={varianteDialogOpen}
        onClose={() => { setVarianteDialogOpen(false); setEditVariante(null); }}
        onSubmit={async (fields) => {
          if (editVariante) {
            await LivingAppsService.updateApfelstrudelVariantenEntry(editVariante.record_id, fields);
          } else {
            await LivingAppsService.createApfelstrudelVariantenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editVariante?.fields}
        zutatenList={zutaten}
        enablePhotoScan={AI_PHOTO_SCAN['ApfelstrudelVarianten']}
      />

      <ZutatenDialog
        open={zutatenDialogOpen}
        onClose={() => { setZutatenDialogOpen(false); setEditZutat(null); }}
        onSubmit={async (fields) => {
          if (editZutat) {
            await LivingAppsService.updateZutatenEntry(editZutat.record_id, fields);
          } else {
            await LivingAppsService.createZutatenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editZutat?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Zutaten']}
      />

      <ConfirmDialog
        open={!!deleteVariante}
        title="Variante löschen"
        description={`Möchtest du „${deleteVariante?.fields.variante_name ?? 'diese Variante'}" wirklich löschen?`}
        onConfirm={async () => {
          if (!deleteVariante) return;
          await LivingAppsService.deleteApfelstrudelVariantenEntry(deleteVariante.record_id);
          setDeleteVariante(null);
          fetchAll();
        }}
        onClose={() => setDeleteVariante(null)}
      />

      <ConfirmDialog
        open={!!deleteZutat}
        title="Zutat löschen"
        description={`Möchtest du „${deleteZutat?.fields.produkt_name ?? 'diese Zutat'}" wirklich löschen?`}
        onConfirm={async () => {
          if (!deleteZutat) return;
          await LivingAppsService.deleteZutatenEntry(deleteZutat.record_id);
          setDeleteZutat(null);
          fetchAll();
        }}
        onClose={() => setDeleteZutat(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
