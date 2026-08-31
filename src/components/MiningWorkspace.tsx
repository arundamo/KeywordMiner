import React, { useState } from 'react';
import { 
  Search, 
  Youtube, 
  ShoppingBag, 
  Globe2, 
  Zap, 
  Layers, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Sparkles, 
  HelpCircle,
  Clock,
  Gauge
} from 'lucide-react';
import { DepthMode, MiningProgress, Platform, RegionOption } from '../types';
import { REGIONS } from '../services/scraper';

interface MiningWorkspaceProps {
  platform: Platform;
  setPlatform: (p: Platform) => void;
  seedText: string;
  setSeedText: (text: string) => void;
  region: RegionOption;
  setRegion: (r: RegionOption) => void;
  depthMode: DepthMode;
  setDepthMode: (d: DepthMode) => void;
  progress: MiningProgress;
  onStartMining: () => void;
  onPauseMining: () => void;
  onResumeMining: () => void;
  onStopMining: () => void;
  onClearResults: () => void;
  resultsCount: number;
}

const PRESET_SEEDS = [
  { label: '🤖 AI & SaaS', seeds: 'ai tools, workflow automation, prompt engineering' },
  { label: '🏋️ Fitness & Diet', seeds: 'home workout, protein powder, intermittent fasting' },
  { label: '☕ Specialty Coffee', seeds: 'espresso machine, coffee grinder, pour over' },
  { label: '🚗 Electric Cars', seeds: 'electric vehicle, ev charger, home battery' },
];

export const MiningWorkspace: React.FC<MiningWorkspaceProps> = ({
  platform,
  setPlatform,
  seedText,
  setSeedText,
  region,
  setRegion,
  depthMode,
  setDepthMode,
  progress,
  onStartMining,
  onPauseMining,
  onResumeMining,
  onStopMining,
  onClearResults,
  resultsCount,
}) => {
  const [showPresets, setShowPresets] = useState(false);

  const isMining = progress.status === 'mining';
  const isPaused = progress.status === 'paused';
  const isActive = isMining || isPaused;

  const parsedSeedCount = seedText
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean).length;

  const percent = progress.totalQueries > 0 
    ? Math.min(100, Math.round((progress.completedQueries / progress.totalQueries) * 100))
    : 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/40 backdrop-blur-md">
      {/* Top Bar: Platform Selector & Seed Presets */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Target Platform
          </span>
          <div className="inline-flex p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            {/* Google */}
            <button
              id="platform-google-tab"
              type="button"
              onClick={() => !isActive && setPlatform('google')}
              disabled={isActive}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                platform === 'google'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              } ${isActive ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="w-4 h-4 flex items-center justify-center font-bold text-[13px] text-blue-400">
                G
              </div>
              <span>Google Web</span>
              {platform === 'google' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              )}
            </button>

            {/* YouTube */}
            <button
              id="platform-youtube-tab"
              type="button"
              onClick={() => !isActive && setPlatform('youtube')}
              disabled={isActive}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                platform === 'youtube'
                  ? 'bg-red-600/20 text-red-400 border border-red-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              } ${isActive ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Youtube className="w-4 h-4 text-red-400" />
              <span>YouTube Video</span>
              {platform === 'youtube' && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              )}
            </button>

            {/* Amazon */}
            <button
              id="platform-amazon-tab"
              type="button"
              onClick={() => !isActive && setPlatform('amazon')}
              disabled={isActive}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                platform === 'amazon'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              } ${isActive ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Amazon Products</span>
              {platform === 'amazon' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              )}
            </button>
          </div>
        </div>

        {/* Region & Depth Selector Row */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Target Region */}
          <div className="flex-1 sm:flex-initial">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Target Region
            </span>
            <div className="relative">
              <select
                id="target-region-select"
                value={region.id}
                onChange={(e) => {
                  const selected = REGIONS.find((r) => r.id === e.target.value);
                  if (selected) setRegion(selected);
                }}
                disabled={isActive}
                className="w-full sm:w-56 appearance-none bg-slate-950/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 pr-9 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                    {r.flag} {r.name}
                  </option>
                ))}
              </select>
              <Globe2 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Mining Depth Toggle */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Mining Depth
            </span>
            <div className="inline-flex p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
              <button
                id="depth-fast-toggle"
                type="button"
                onClick={() => !isActive && setDepthMode('fast')}
                disabled={isActive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  depthMode === 'fast'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                } ${isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Fast (~100 terms)</span>
              </button>
              <button
                id="depth-deep-toggle"
                type="button"
                onClick={() => !isActive && setDepthMode('deep')}
                disabled={isActive}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  depthMode === 'deep'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                } ${isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Deep (~1,000+ terms)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Seed Input Box */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="seed-input" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>Seed Keywords</span>
            <span className="text-slate-500 text-[11px] lowercase font-normal">
              (comma or line-separated)
            </span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">
              {parsedSeedCount} {parsedSeedCount === 1 ? 'seed' : 'seeds'} loaded
            </span>
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              {showPresets ? 'Hide presets' : 'Sample presets'}
            </button>
          </div>
        </div>

        {/* Presets Chips if expanded */}
        {showPresets && (
          <div className="mb-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-wrap gap-2 animate-in fade-in duration-200">
            <span className="text-xs text-slate-400 self-center mr-1">Quick Load:</span>
            {PRESET_SEEDS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={isActive}
                onClick={() => setSeedText(preset.seeds)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            id="seed-input"
            rows={3}
            value={seedText}
            onChange={(e) => setSeedText(e.target.value)}
            disabled={isActive}
            placeholder="e.g. coffee maker, espresso beans, cold brew&#10;or one keyword per line..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 resize-y transition-all"
          />
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        {/* Left Status & Clear */}
        <div className="flex items-center gap-3">
          {resultsCount > 0 && !isActive && (
            <button
              id="clear-results-button"
              type="button"
              onClick={onClearResults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear {resultsCount.toLocaleString()} terms</span>
            </button>
          )}

          {isActive && (
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-slate-500">Querying:</span>
              <span className="text-amber-300 font-semibold truncate max-w-[200px] sm:max-w-xs">
                {progress.currentQuery || 'Starting pipeline...'}
              </span>
            </div>
          )}
        </div>

        {/* Right Primary Action Buttons */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Pause / Resume Controls when active */}
          {isMining && (
            <button
              id="pause-mining-button"
              type="button"
              onClick={onPauseMining}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {isPaused && (
            <button
              id="resume-mining-button"
              type="button"
              onClick={onResumeMining}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          )}

          {isActive && (
            <button
              id="stop-mining-button"
              type="button"
              onClick={onStopMining}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {/* Start Mining Button */}
          {!isActive && (
            <button
              id="start-mining-button"
              type="button"
              onClick={onStartMining}
              disabled={parsedSeedCount === 0}
              className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Start Mining</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Mining Progress HUD */}
      {isActive && (
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2 font-medium">
            <div className="flex items-center gap-3">
              <span className="text-slate-300">
                Progress: <strong className="text-white font-bold">{percent}%</strong>
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">
                Queries: <strong className="text-slate-200">{progress.completedQueries}</strong> / {progress.totalQueries}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {progress.foundCount} unique terms
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-slate-200">{progress.speedQueriesPerSec}</span> req/s
              </span>
            </div>
          </div>

          {/* Progress Track Bar */}
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};
