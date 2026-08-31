import React from 'react';
import { Pickaxe, Sparkles, Activity, Layers } from 'lucide-react';
import { MiningStatus } from '../types';

interface HeaderProps {
  status: MiningStatus;
  totalKeywords: number;
}

export const Header: React.FC<HeaderProps> = ({ status, totalKeywords }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Pickaxe className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Keyword Miner
                <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PRO
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Recursive Search Intelligence & Real-Time Intent Scraper
            </p>
          </div>
        </div>

        {/* Live Status Indicator & Global Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs font-medium">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Total Harvested:</span>
            <span className="font-bold text-amber-400 tabular-nums">
              {totalKeywords.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors">
            {status === 'mining' && (
              <div className="flex items-center gap-2 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold">Mining Active</span>
              </div>
            )}
            {status === 'paused' && (
              <div className="flex items-center gap-2 text-amber-400 border-amber-500/30 bg-amber-500/10">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                <span>Paused</span>
              </div>
            )}
            {status === 'completed' && (
              <div className="flex items-center gap-2 text-cyan-400 border-cyan-500/30 bg-cyan-500/10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Finished</span>
              </div>
            )}
            {status === 'idle' && (
              <div className="flex items-center gap-2 text-slate-400 border-slate-700/50 bg-slate-800/30">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                <span>Ready</span>
              </div>
            )}
            {status === 'cancelled' && (
              <div className="flex items-center gap-2 text-rose-400 border-rose-500/30 bg-rose-500/10">
                <span className="h-2 w-2 rounded-full bg-rose-400"></span>
                <span>Stopped</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
