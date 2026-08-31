import React from 'react';
import { 
  HelpCircle, 
  ShoppingCart, 
  TrendingUp, 
  Compass, 
  FileText, 
  Sparkles,
  Layers,
  FilterX
} from 'lucide-react';
import { KeywordResult, SearchIntent } from '../types';

interface AnalyticsHUDProps {
  results: KeywordResult[];
  activeIntentFilter: SearchIntent | 'all';
  onSelectIntentFilter: (intent: SearchIntent | 'all') => void;
}

export const AnalyticsHUD: React.FC<AnalyticsHUDProps> = ({
  results,
  activeIntentFilter,
  onSelectIntentFilter,
}) => {
  if (results.length === 0) {
    return null;
  }

  const total = results.length;

  const counts: Record<SearchIntent, number> = {
    informational: 0,
    commercial: 0,
    transactional: 0,
    navigational: 0,
  };

  let totalWords = 0;
  let shortTail = 0; // 1-2
  let mediumTail = 0; // 3-4
  let longTail = 0; // 5+

  for (const r of results) {
    counts[r.intent] = (counts[r.intent] || 0) + 1;
    totalWords += r.wordCount;
    if (r.wordCount <= 2) shortTail++;
    else if (r.wordCount <= 4) mediumTail++;
    else longTail++;
  }

  const avgWords = total > 0 ? (totalWords / total).toFixed(1) : '0';
  const longTailPercent = total > 0 ? Math.round(((mediumTail + longTail) / total) * 100) : 0;

  const infoPercent = total > 0 ? Math.round((counts.informational / total) * 100) : 0;
  const commPercent = total > 0 ? Math.round((counts.commercial / total) * 100) : 0;
  const transPercent = total > 0 ? Math.round((counts.transactional / total) * 100) : 0;
  const navPercent = total > 0 ? Math.round((counts.navigational / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Keywords Card */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Discovered
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
            {total.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">100% deduplicated</span> in real time
          </p>
        </div>
      </div>

      {/* 2. Intent Distribution Card */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg lg:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Search Intent Classification
            </span>
            {activeIntentFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                Filtered: {activeIntentFilter}
              </span>
            )}
          </div>
          {activeIntentFilter !== 'all' ? (
            <button
              type="button"
              onClick={() => onSelectIntentFilter('all')}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <FilterX className="w-3 h-3" />
              <span>Show All</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 hidden sm:block">
              Click any intent to filter results
            </div>
          )}
        </div>

        {/* Stacked intent distribution visual bar with click handlers */}
        <div className="mt-3">
          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-950 border border-slate-800 cursor-pointer">
            {infoPercent > 0 && (
              <button
                type="button"
                style={{ width: `${infoPercent}%` }} 
                className="bg-blue-500 hover:bg-blue-400 h-full transition-all duration-200 cursor-pointer"
                title={`Click to filter Informational (${counts.informational})`}
                onClick={() => onSelectIntentFilter(activeIntentFilter === 'informational' ? 'all' : 'informational')}
              />
            )}
            {commPercent > 0 && (
              <button
                type="button"
                style={{ width: `${commPercent}%` }} 
                className="bg-amber-500 hover:bg-amber-400 h-full transition-all duration-200 cursor-pointer"
                title={`Click to filter Commercial (${counts.commercial})`}
                onClick={() => onSelectIntentFilter(activeIntentFilter === 'commercial' ? 'all' : 'commercial')}
              />
            )}
            {transPercent > 0 && (
              <button
                type="button"
                style={{ width: `${transPercent}%` }} 
                className="bg-emerald-500 hover:bg-emerald-400 h-full transition-all duration-200 cursor-pointer"
                title={`Click to filter Transactional (${counts.transactional})`}
                onClick={() => onSelectIntentFilter(activeIntentFilter === 'transactional' ? 'all' : 'transactional')}
              />
            )}
            {navPercent > 0 && (
              <button
                type="button"
                style={{ width: `${navPercent}%` }} 
                className="bg-purple-500 hover:bg-purple-400 h-full transition-all duration-200 cursor-pointer"
                title={`Click to filter Navigational (${counts.navigational})`}
                onClick={() => onSelectIntentFilter(activeIntentFilter === 'navigational' ? 'all' : 'navigational')}
              />
            )}
          </div>

          {/* Intent Quick Click Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {/* Informational */}
            <button
              type="button"
              onClick={() => onSelectIntentFilter(activeIntentFilter === 'informational' ? 'all' : 'informational')}
              title="Filter by Informational intent"
              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                activeIntentFilter === 'informational'
                  ? 'bg-blue-950/90 border-blue-500/70 shadow-sm text-blue-200 ring-2 ring-blue-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-blue-500/40 hover:bg-blue-950/30'
              }`}
            >
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Info</span>
              </div>
              <div className="text-sm font-bold text-slate-100 mt-1 tabular-nums">
                {counts.informational} <span className="text-[10px] text-slate-400 font-normal">({infoPercent}%)</span>
              </div>
            </button>

            {/* Commercial */}
            <button
              type="button"
              onClick={() => onSelectIntentFilter(activeIntentFilter === 'commercial' ? 'all' : 'commercial')}
              title="Filter by Commercial intent"
              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                activeIntentFilter === 'commercial'
                  ? 'bg-amber-950/90 border-amber-500/70 shadow-sm text-amber-200 ring-2 ring-amber-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-amber-500/40 hover:bg-amber-950/30'
              }`}
            >
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Commercial</span>
              </div>
              <div className="text-sm font-bold text-slate-100 mt-1 tabular-nums">
                {counts.commercial} <span className="text-[10px] text-slate-400 font-normal">({commPercent}%)</span>
              </div>
            </button>

            {/* Transactional */}
            <button
              type="button"
              onClick={() => onSelectIntentFilter(activeIntentFilter === 'transactional' ? 'all' : 'transactional')}
              title="Filter by Transactional intent"
              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                activeIntentFilter === 'transactional'
                  ? 'bg-emerald-950/90 border-emerald-500/70 shadow-sm text-emerald-200 ring-2 ring-emerald-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-950/30'
              }`}
            >
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Transactional</span>
              </div>
              <div className="text-sm font-bold text-slate-100 mt-1 tabular-nums">
                {counts.transactional} <span className="text-[10px] text-slate-400 font-normal">({transPercent}%)</span>
              </div>
            </button>

            {/* Navigational */}
            <button
              type="button"
              onClick={() => onSelectIntentFilter(activeIntentFilter === 'navigational' ? 'all' : 'navigational')}
              title="Filter by Navigational intent"
              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                activeIntentFilter === 'navigational'
                  ? 'bg-purple-950/90 border-purple-500/70 shadow-sm text-purple-200 ring-2 ring-purple-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-purple-500/40 hover:bg-purple-950/30'
              }`}
            >
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
                <Compass className="w-3.5 h-3.5" />
                <span>Nav</span>
              </div>
              <div className="text-sm font-bold text-slate-100 mt-1 tabular-nums">
                {counts.navigational} <span className="text-[10px] text-slate-400 font-normal">({navPercent}%)</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Long-tail & Word Count Card */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Query Depth
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              {avgWords}
            </span>
            <span className="text-xs text-slate-400 font-medium">avg words / phrase</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            <strong className="text-amber-400 font-semibold">{longTailPercent}%</strong> long-tail (3+ words)
          </div>
        </div>
      </div>
    </div>
  );
};
