import { SearchIntent } from '../types';

interface IntentRule {
  intent: SearchIntent;
  weight: number;
  patterns: RegExp[];
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: 'transactional',
    weight: 10,
    patterns: [
      /\b(buy|purchase|order|shop|store|cart|checkout|pricing|price|costs?|cheap|cheapest|discount|discounts|coupon|coupons|promo|code|deal|deals|sale|sales|clearance|afford|affordable|subscription|hire|booking|quote|voucher|cashback|for sale|on sale)\b/i,
      /\b(\$|€|£|\d+\s*(usd|eur|gbp))\b/i,
      /\b(where to buy|how much is|how much does|license cost)\b/i,
    ],
  },
  {
    intent: 'commercial',
    weight: 8,
    patterns: [
      /\b(best|top\s*\d+|vs|versus|compared|comparison|review|reviews|reviewer|alternative|alternatives|ratings?|rated|benchmark|specs|specifications|pros and cons|which is better|recommendations?|tier list|worth it|good or bad)\b/i,
      /\b(for (beginners|students|small business|mac|pc|ios|android|professionals))\b/i,
    ],
  },
  {
    intent: 'informational',
    weight: 7,
    patterns: [
      /\b(how|why|what|when|where|who|which|whose|whom)\b/i,
      /\b(how to|guide|tutorial|tips|tricks|ideas|meaning|definition|define|explain|explained|explanation|examples?|history|formula|steps?|diy|learn|course|symptoms|causes|fix|fixes|troubleshoot|resolve|error|docs|documentation|wiki)\b/i,
      /\b(difference between|can you|is it possible|does it work)\b/i,
    ],
  },
  {
    intent: 'navigational',
    weight: 6,
    patterns: [
      /\b(login|log in|signin|sign in|signup|sign up|portal|official|account|my account|dashboard|homepage|website|app download|download|apk|support|customer service|phone number|contact|careers|status page)\b/i,
      /\.com|\.org|\.net|\.io|\.app|\.ai\b/i,
    ],
  },
];

/**
 * Accurately classifies a keyword string into one of the 4 core search intents.
 */
export function classifyIntent(keyword: string): SearchIntent {
  const clean = keyword.trim().toLowerCase();
  
  // High confidence rule checks
  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(clean)) {
        return rule.intent;
      }
    }
  }

  // Heuristic fallbacks based on query structure
  if (clean.startsWith('how') || clean.startsWith('why') || clean.startsWith('what') || clean.startsWith('can')) {
    return 'informational';
  }
  if (clean.startsWith('best') || clean.startsWith('top') || clean.includes(' vs ')) {
    return 'commercial';
  }
  if (clean.startsWith('buy') || clean.endsWith('price') || clean.endsWith('cheap')) {
    return 'transactional';
  }

  // Default to informational for general exploratory searches
  return 'informational';
}

export function getIntentColor(intent: SearchIntent): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (intent) {
    case 'transactional':
      return {
        bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
        text: 'text-emerald-300',
        border: 'border-emerald-500/40',
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
      };
    case 'commercial':
      return {
        bg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        text: 'text-amber-300',
        border: 'border-amber-500/40',
        dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
      };
    case 'informational':
      return {
        bg: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
        text: 'text-blue-300',
        border: 'border-blue-500/40',
        dot: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]',
      };
    case 'navigational':
      return {
        bg: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
        text: 'text-purple-300',
        border: 'border-purple-500/40',
        dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]',
      };
  }
}
