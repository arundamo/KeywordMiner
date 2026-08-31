import React, { useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { MiningWorkspace } from './components/MiningWorkspace';
import { AnalyticsHUD } from './components/AnalyticsHUD';
import { ResultsTable } from './components/ResultsTable';
import { KeywordClusters } from './components/KeywordClusters';
import { 
  DepthMode, 
  KeywordResult, 
  MiningProgress, 
  Platform, 
  RegionOption, 
  SearchIntent 
} from './types';
import { REGIONS, ScraperController, runMiningEngine } from './services/scraper';

export default function App() {
  // Platform & Configuration State
  const [platform, setPlatform] = useState<Platform>('google');
  const [seedText, setSeedText] = useState<string>('ai tools, prompt engineering, saas software');
  const [region, setRegion] = useState<RegionOption>(REGIONS[0]);
  const [depthMode, setDepthMode] = useState<DepthMode>('fast');

  // Results State
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [activeIntentFilter, setActiveIntentFilter] = useState<SearchIntent | 'all'>('all');

  // Controller reference for async scraper pause/resume/cancel
  const controllerRef = useRef<ScraperController | null>(null);

  // Mining Telemetry Progress
  const [progress, setProgress] = useState<MiningProgress>({
    status: 'idle',
    totalQueries: 0,
    completedQueries: 0,
    foundCount: 0,
    currentQuery: '',
    startTime: null,
    speedQueriesPerSec: 0,
    activePlatform: 'google',
  });

  // Real-time batching buffer for smooth 60fps streaming updates
  const bufferRef = useRef<KeywordResult[]>([]);
  const frameRequestRef = useRef<number | null>(null);

  const flushBuffer = useCallback(() => {
    if (bufferRef.current.length > 0) {
      const itemsToAdd = [...bufferRef.current];
      bufferRef.current = [];
      setResults((prev) => {
        const existingIds = new Set(prev.map((p) => p.keyword.toLowerCase()));
        const uniqueNew = itemsToAdd.filter((item) => !existingIds.has(item.keyword.toLowerCase()));
        return [...prev, ...uniqueNew];
      });
    }
  }, []);

  // Start Mining Handler
  const handleStartMining = async () => {
    const rawSeeds = seedText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawSeeds.length === 0) return;

    // Reset buffer and controller
    if (controllerRef.current) {
      controllerRef.current.cancel();
    }

    const newController = new ScraperController();
    controllerRef.current = newController;
    bufferRef.current = [];

    setProgress({
      status: 'mining',
      totalQueries: 0,
      completedQueries: 0,
      foundCount: 0,
      currentQuery: 'Initializing query matrix...',
      startTime: Date.now(),
      speedQueriesPerSec: 0,
      activePlatform: platform,
    });

    // Schedule periodic buffer flush for smooth rendering
    const interval = setInterval(() => {
      flushBuffer();
    }, 120);

    try {
      await runMiningEngine({
        seeds: rawSeeds,
        platform,
        region,
        depthMode,
        controller: newController,
        onKeywordDiscovered: (keyword) => {
          bufferRef.current.push(keyword);
        },
        onProgress: (p) => {
          setProgress(p);
        },
      });
    } catch (err) {
      console.error('Mining engine error:', err);
    } finally {
      clearInterval(interval);
      flushBuffer();
      if (newController.getCancelled()) {
        setProgress((prev) => ({ ...prev, status: 'cancelled' }));
      } else {
        setProgress((prev) => ({ ...prev, status: 'completed' }));
      }
    }
  };

  const handlePauseMining = () => {
    if (controllerRef.current) {
      controllerRef.current.pause();
      setProgress((prev) => ({ ...prev, status: 'paused' }));
    }
  };

  const handleResumeMining = () => {
    if (controllerRef.current) {
      controllerRef.current.resume();
      setProgress((prev) => ({ ...prev, status: 'mining' }));
    }
  };

  const handleStopMining = () => {
    if (controllerRef.current) {
      controllerRef.current.cancel();
      flushBuffer();
      setProgress((prev) => ({ ...prev, status: 'cancelled' }));
    }
  };

  const handleClearResults = () => {
    if (controllerRef.current) {
      controllerRef.current.cancel();
    }
    bufferRef.current = [];
    setResults([]);
    setActiveIntentFilter('all');
    setProgress({
      status: 'idle',
      totalQueries: 0,
      completedQueries: 0,
      foundCount: 0,
      currentQuery: '',
      startTime: null,
      speedQueriesPerSec: 0,
      activePlatform: platform,
    });
  };

  const handleDeleteKeywords = (idsToDelete: string[]) => {
    const set = new Set(idsToDelete);
    setResults((prev) => prev.filter((r) => !set.has(r.id)));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Fixed Header */}
      <Header status={progress.status} totalKeywords={results.length} />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Mining Controls Workspace */}
        <MiningWorkspace
          platform={platform}
          setPlatform={setPlatform}
          seedText={seedText}
          setSeedText={setSeedText}
          region={region}
          setRegion={setRegion}
          depthMode={depthMode}
          setDepthMode={setDepthMode}
          progress={progress}
          onStartMining={handleStartMining}
          onPauseMining={handlePauseMining}
          onResumeMining={handleResumeMining}
          onStopMining={handleStopMining}
          onClearResults={handleClearResults}
          resultsCount={results.length}
        />

        {/* Analytics Overview HUD */}
        {results.length > 0 && (
          <AnalyticsHUD
            results={results}
            activeIntentFilter={activeIntentFilter}
            onSelectIntentFilter={setActiveIntentFilter}
          />
        )}

        {/* Keyword N-Gram Clusters */}
        {results.length >= 5 && (
          <KeywordClusters
            results={results}
            onAddNegativeKeyword={(word) => {
              // Appends to negative keyword filter if needed
              const event = new CustomEvent('add-negative-kw', { detail: word });
              window.dispatchEvent(event);
            }}
          />
        )}

        {/* Results Interactive Data Table */}
        <ResultsTable
          results={results}
          activeIntentFilter={activeIntentFilter}
          onSelectIntentFilter={setActiveIntentFilter}
          onDeleteKeywords={handleDeleteKeywords}
        />
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Keyword Miner • Real-Time Search Intelligence Platform</span>
          <span className="font-mono text-[11px] text-slate-600">
            Powered by Recursive Autocomplete Expansion
          </span>
        </div>
      </footer>
    </div>
  );
}
