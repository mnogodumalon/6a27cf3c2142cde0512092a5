// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Zutaten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    kategorie?: LookupValue;
    marke_hersteller?: string;
    bezugsquelle?: string;
    notizen_zutat?: string;
    produkt_name?: string;
  };
}

export interface ApfelstrudelVarianten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    datum_zubereitung?: string; // Format: YYYY-MM-DD oder ISO String
    verwendete_zutaten?: string; // applookup -> URL zu 'Zutaten' Record
    bewertung?: LookupValue;
    kommentar?: string;
    variante_name?: string;
  };
}

export const APP_IDS = {
  ZUTATEN: '6a27cf2743b0d7439fa14f61',
  APFELSTRUDEL_VARIANTEN: '6a27cf2c36acebe2902395b6',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'zutaten': {
    kategorie: [{ key: "ei", label: "Ei" }, { key: "teig", label: "Teig" }, { key: "obst", label: "Obst" }, { key: "zucker", label: "Zucker & Süßungsmittel" }, { key: "gewuerz", label: "Gewürz" }, { key: "fett", label: "Fett & Öl" }, { key: "milchprodukt", label: "Milchprodukt" }, { key: "sonstiges", label: "Sonstiges" }],
  },
  'apfelstrudel_varianten': {
    bewertung: [{ key: "bewertung_2", label: "2 – Ausreichend" }, { key: "bewertung_3", label: "3 – Gut" }, { key: "bewertung_4", label: "4 – Sehr gut" }, { key: "bewertung_5", label: "5 – Ausgezeichnet" }, { key: "bewertung_1", label: "1 – Nicht gut" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'zutaten': {
    'kategorie': 'lookup/select',
    'marke_hersteller': 'string/text',
    'bezugsquelle': 'string/text',
    'notizen_zutat': 'string/textarea',
    'produkt_name': 'string/text',
  },
  'apfelstrudel_varianten': {
    'datum_zubereitung': 'date/date',
    'verwendete_zutaten': 'applookup/select',
    'bewertung': 'lookup/radio',
    'kommentar': 'string/textarea',
    'variante_name': 'string/text',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateZutaten = StripLookup<Zutaten['fields']>;
export type CreateApfelstrudelVarianten = StripLookup<ApfelstrudelVarianten['fields']>;