import type { ApfelstrudelVarianten, Zutaten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface ApfelstrudelVariantenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: ApfelstrudelVarianten | null;
  onEdit: (record: ApfelstrudelVarianten) => void;
  zutatenList: Zutaten[];
}

export function ApfelstrudelVariantenViewDialog({ open, onClose, record, onEdit, zutatenList }: ApfelstrudelVariantenViewDialogProps) {
  function getZutatenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return zutatenList.find(r => r.record_id === id)?.fields.marke_hersteller ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apfelstrudel-Varianten anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum der Zubereitung</Label>
            <p className="text-sm">{formatDate(record.fields.datum_zubereitung)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verwendete Zutaten</Label>
            <p className="text-sm">{getZutatenDisplayName(record.fields.verwendete_zutaten)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bewertung (1–5)</Label>
            <Badge variant="secondary">{record.fields.bewertung?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kommentar / Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.kommentar ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bezeichnung der Variante</Label>
            <p className="text-sm">{record.fields.variante_name ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}