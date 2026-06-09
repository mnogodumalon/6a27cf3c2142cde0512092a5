import type { ApfelstrudelVarianten } from './app';

export type EnrichedApfelstrudelVarianten = ApfelstrudelVarianten & {
  verwendete_zutatenName: string;
};
