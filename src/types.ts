export type Platform = 'google' | 'youtube' | 'amazon';

export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';

export type DepthMode = 'fast' | 'deep';

export interface RegionOption {
  id: string;
  name: string;
  gl: string;
  hl: string;
  amazonMkt: string;
  flag: string;
}

export interface KeywordResult {
  id: string;
  keyword: string;
  platform: Platform;
  intent: SearchIntent;
  wordCount: number;
  charCount: number;
  modifierType: 'seed' | 'alphabet' | 'number' | 'question' | 'commercial' | 'transactional' | 'deep_combination';
  discoveredAt: number;
  rootSeed: string;
  score?: number;
}

export type MiningStatus = 'idle' | 'mining' | 'paused' | 'completed' | 'cancelled';

export interface MiningProgress {
  status: MiningStatus;
  totalQueries: number;
  completedQueries: number;
  foundCount: number;
  currentQuery: string;
  startTime: number | null;
  speedQueriesPerSec: number;
  activePlatform: Platform;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'clipboard_broad' | 'clipboard_phrase' | 'clipboard_exact' | 'clipboard_notion';
  onlySelected?: boolean;
}

export interface IntentStats {
  informational: number;
  commercial: number;
  transactional: number;
  navigational: number;
}
