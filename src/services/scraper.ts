import { DepthMode, KeywordResult, MiningProgress, Platform, RegionOption } from '../types';
import { classifyIntent } from './intentClassifier';

export const REGIONS: RegionOption[] = [
  { id: 'us', name: 'Global / United States', gl: 'us', hl: 'en', amazonMkt: '1', flag: '🇺🇸' },
  { id: 'uk', name: 'United Kingdom', gl: 'uk', hl: 'en', amazonMkt: '3', flag: '🇬🇧' },
  { id: 'ca', name: 'Canada', gl: 'ca', hl: 'en', amazonMkt: '7', flag: '🇨🇦' },
  { id: 'au', name: 'Australia', gl: 'au', hl: 'en', amazonMkt: '111172', flag: '🇦🇺' },
  { id: 'de', name: 'Germany', gl: 'de', hl: 'de', amazonMkt: '4', flag: '🇩🇪' },
  { id: 'fr', name: 'France', gl: 'fr', hl: 'fr', amazonMkt: '5', flag: '🇫🇷' },
  { id: 'es', name: 'Spain', gl: 'es', hl: 'es', amazonMkt: '44551', flag: '🇪🇸' },
  { id: 'in', name: 'India', gl: 'in', hl: 'en', amazonMkt: '44571', flag: '🇮🇳' },
  { id: 'jp', name: 'Japan', gl: 'jp', hl: 'ja', amazonMkt: '6', flag: '🇯🇵' },
  { id: 'br', name: 'Brazil', gl: 'br', hl: 'pt', amazonMkt: '526970', flag: '🇧🇷' },
];

export interface QueryTask {
  query: string;
  modifierType: KeywordResult['modifierType'];
  rootSeed: string;
  depth: number;
}

export class ScraperController {
  private isCancelled = false;
  private isPaused = false;
  private resolvePause: (() => void) | null = null;

  cancel() {
    this.isCancelled = true;
    if (this.resolvePause) {
      this.resolvePause();
      this.resolvePause = null;
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    if (this.resolvePause) {
      this.resolvePause();
      this.resolvePause = null;
    }
  }

  getCancelled() {
    return this.isCancelled;
  }

  getPaused() {
    return this.isPaused;
  }

  async checkPausePoint() {
    if (this.isPaused && !this.isCancelled) {
      await new Promise<void>((resolve) => {
        this.resolvePause = resolve;
      });
    }
  }
}

/**
 * Generates an array of query tasks based on depth mode and seed keywords.
 */
export function buildQueryExpansionList(seeds: string[], depthMode: DepthMode): QueryTask[] {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const numbers = '0123456789'.split('');
  const questionPrefixes = [
    'how to', 'how', 'why', 'what is', 'what', 'where', 'when', 'which', 'who', 'can', 'is', 'how does'
  ];
  const commercialPrefixes = [
    'best', 'top', 'vs', 'versus', 'review', 'reviews', 'alternatives', 'alternative to', 'comparison', 'guide'
  ];
  const transactionalPrefixes = [
    'buy', 'cheap', 'price', 'pricing', 'discount', 'cost of', 'coupon', 'deals on', 'for sale'
  ];

  const tasks: QueryTask[] = [];

  for (const rawSeed of seeds) {
    const seed = rawSeed.trim();
    if (!seed) continue;

    // 1. Direct Seed Query
    tasks.push({ query: seed, modifierType: 'seed', rootSeed: seed, depth: 0 });

    if (depthMode === 'fast') {
      // Fast mode: Seed + [a-z]
      for (const char of alphabet) {
        tasks.push({ query: `${seed} ${char}`, modifierType: 'alphabet', rootSeed: seed, depth: 1 });
      }
      // Seed + [0-9]
      for (const num of numbers) {
        tasks.push({ query: `${seed} ${num}`, modifierType: 'number', rootSeed: seed, depth: 1 });
      }
      // High-impact questions
      for (const q of ['how to', 'why', 'what is', 'best', 'top']) {
        tasks.push({ query: `${q} ${seed}`, modifierType: 'question', rootSeed: seed, depth: 1 });
      }
      // Suffix vs
      tasks.push({ query: `${seed} vs`, modifierType: 'commercial', rootSeed: seed, depth: 1 });
      tasks.push({ query: `${seed} price`, modifierType: 'transactional', rootSeed: seed, depth: 1 });
    } else {
      // Deep mode:
      // A. Suffix Alphabet
      for (const char of alphabet) {
        tasks.push({ query: `${seed} ${char}`, modifierType: 'alphabet', rootSeed: seed, depth: 1 });
      }
      // B. Prefix Alphabet
      for (const char of alphabet) {
        tasks.push({ query: `${char} ${seed}`, modifierType: 'alphabet', rootSeed: seed, depth: 1 });
      }
      // C. Numbers
      for (const num of numbers) {
        tasks.push({ query: `${seed} ${num}`, modifierType: 'number', rootSeed: seed, depth: 1 });
      }
      // D. Questions
      for (const q of questionPrefixes) {
        tasks.push({ query: `${q} ${seed}`, modifierType: 'question', rootSeed: seed, depth: 1 });
        tasks.push({ query: `${seed} ${q}`, modifierType: 'question', rootSeed: seed, depth: 1 });
      }
      // E. Commercial & Transactional Modifiers
      for (const c of commercialPrefixes) {
        tasks.push({ query: `${c} ${seed}`, modifierType: 'commercial', rootSeed: seed, depth: 1 });
        tasks.push({ query: `${seed} ${c}`, modifierType: 'commercial', rootSeed: seed, depth: 1 });
      }
      for (const t of transactionalPrefixes) {
        tasks.push({ query: `${t} ${seed}`, modifierType: 'transactional', rootSeed: seed, depth: 1 });
        tasks.push({ query: `${seed} ${t}`, modifierType: 'transactional', rootSeed: seed, depth: 1 });
      }
      // F. Double Alphabet Sub-combinations for deep coverage
      const highFreqLetters = ['a', 'b', 'c', 'd', 'e', 'm', 'p', 's', 't'];
      for (const l1 of highFreqLetters) {
        for (const l2 of ['a', 'e', 'i', 'o', 'u', 's', 'r']) {
          tasks.push({ query: `${seed} ${l1}${l2}`, modifierType: 'deep_combination', rootSeed: seed, depth: 2 });
        }
      }
    }
  }

  return tasks;
}

/**
 * Fetches suggestions for a single query.
 */
export async function fetchSuggestions(
  platform: Platform,
  query: string,
  region: RegionOption
): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      platform,
      query,
      gl: region.gl,
      hl: region.hl,
      mkt: region.amazonMkt,
    });

    const response = await fetch(`/api/suggest?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.suggestions)) {
        return data.suggestions;
      }
    }
  } catch (serverErr) {
    // Graceful fallback to client-side fetching if server endpoint is not responding
    console.warn('API proxy fallback to direct fetch:', serverErr);
  }

  // Direct client-side fallback
  try {
    let url = '';
    if (platform === 'youtube') {
      url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}&gl=${region.gl}&hl=${region.hl}`;
    } else if (platform === 'amazon') {
      url = `https://completion.amazon.com/search/search-keywords?mkt=${region.amazonMkt}&search-alias=aps&q=${encodeURIComponent(query)}`;
    } else {
      url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}&gl=${region.gl}&hl=${region.hl}`;
    }

    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1].map((s: any) => (typeof s === 'string' ? s : Array.isArray(s) ? s[0] : String(s)));
    }
  } catch {
    // Silent catch
  }

  return [];
}

/**
 * Executes high-performance concurrent scraping with streaming updates, pause/resume, and real-time deduplication.
 */
export async function runMiningEngine({
  seeds,
  platform,
  region,
  depthMode,
  controller,
  onKeywordDiscovered,
  onProgress,
}: {
  seeds: string[];
  platform: Platform;
  region: RegionOption;
  depthMode: DepthMode;
  controller: ScraperController;
  onKeywordDiscovered: (keyword: KeywordResult) => void;
  onProgress: (progress: MiningProgress) => void;
}): Promise<void> {
  const tasks = buildQueryExpansionList(seeds, depthMode);
  const seenKeywords = new Set<string>();
  let completedCount = 0;
  let foundCount = 0;
  const startTime = Date.now();

  const concurrency = depthMode === 'deep' ? 8 : 6;
  const taskQueue = [...tasks];

  // If in deep mode, we also queue discovered long-tail candidates dynamically
  const discoveredSecondTierQueue: QueryTask[] = [];

  const updateProgress = (currentQuery: string, status: MiningProgress['status'] = 'mining') => {
    const elapsedSec = (Date.now() - startTime) / 1000;
    const speed = elapsedSec > 0 ? Number((completedCount / elapsedSec).toFixed(1)) : 0;

    onProgress({
      status,
      totalQueries: tasks.length + discoveredSecondTierQueue.length,
      completedQueries: completedCount,
      foundCount,
      currentQuery,
      startTime,
      speedQueriesPerSec: speed,
      activePlatform: platform,
    });
  };

  const processTask = async (task: QueryTask) => {
    if (controller.getCancelled()) return;
    await controller.checkPausePoint();
    if (controller.getCancelled()) return;

    updateProgress(task.query, 'mining');

    const suggestions = await fetchSuggestions(platform, task.query, region);

    for (const rawText of suggestions) {
      if (controller.getCancelled()) break;
      const clean = rawText.trim();
      if (!clean) continue;
      const normalizedKey = clean.toLowerCase();

      if (!seenKeywords.has(normalizedKey)) {
        seenKeywords.add(normalizedKey);
        foundCount++;

        const words = clean.split(/\s+/).filter(Boolean);
        const intent = classifyIntent(clean);

        const newResult: KeywordResult = {
          id: `kw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          keyword: clean,
          platform,
          intent,
          wordCount: words.length,
          charCount: clean.length,
          modifierType: task.modifierType,
          discoveredAt: Date.now(),
          rootSeed: task.rootSeed,
        };

        onKeywordDiscovered(newResult);

        // In deep mode, if a keyword is interesting (3-4 words), expand it once
        if (depthMode === 'deep' && words.length <= 3 && task.depth < 2 && discoveredSecondTierQueue.length < 50) {
          discoveredSecondTierQueue.push({
            query: `${clean} vs`,
            modifierType: 'deep_combination',
            rootSeed: task.rootSeed,
            depth: task.depth + 1,
          });
        }
      }
    }

    completedCount++;
  };

  // Run initial pool
  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(
      (async () => {
        while (taskQueue.length > 0 || discoveredSecondTierQueue.length > 0) {
          if (controller.getCancelled()) break;
          await controller.checkPausePoint();

          const task = taskQueue.shift() || discoveredSecondTierQueue.shift();
          if (!task) break;

          await processTask(task);
          // Micro-pause to prevent flooding
          await new Promise((r) => setTimeout(r, 20));
        }
      })()
    );
  }

  await Promise.all(workers);

  const finalStatus = controller.getCancelled() ? 'cancelled' : 'completed';
  updateProgress('', finalStatus);
}
