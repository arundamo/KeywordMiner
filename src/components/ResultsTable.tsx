import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Copy, 
  Trash2, 
  CheckSquare, 
  Square, 
  ExternalLink, 
  Check, 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Youtube, 
  ShoppingBag,
  FileSpreadsheet,
  FileCode,
  ClipboardList,
  Layers,
  ArrowUpDown,
  Tag,
  RotateCcw,
  PlusCircle,
  Download,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { KeywordResult, Platform, SearchIntent } from '../types';
import { getIntentColor } from '../services/intentClassifier';

interface ResultsTableProps {
  results: KeywordResult[];
  activeIntentFilter: SearchIntent | 'all';
  onSelectIntentFilter: (intent: SearchIntent | 'all') => void;
  onDeleteKeywords: (ids: string[]) => void;
}

type SortField = 'keyword' | 'platform' | 'intent' | 'wordCount' | 'discoveredAt';
type SortOrder = 'asc' | 'desc';

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  activeIntentFilter,
  onSelectIntentFilter,
  onDeleteKeywords,
}) => {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [negativeKeywordsInput, setNegativeKeywordsInput] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [wordCountFilter, setWordCountFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('discoveredAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Copy & Export UI feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [showAdsMenu, setShowAdsMenu] = useState(false);

  // Check if any filter is currently applied
  const hasActiveFilters = 
    searchTerm.trim() !== '' || 
    negativeKeywordsInput.trim() !== '' || 
    platformFilter !== 'all' || 
    wordCountFilter !== 'all' || 
    activeIntentFilter !== 'all';

  // Count number of active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (negativeKeywordsInput.trim()) count++;
    if (platformFilter !== 'all') count++;
    if (wordCountFilter !== 'all') count++;
    if (activeIntentFilter !== 'all') count++;
    return count;
  }, [searchTerm, negativeKeywordsInput, platformFilter, wordCountFilter, activeIntentFilter]);

  // Quick reset all filters handler
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setNegativeKeywordsInput('');
    setPlatformFilter('all');
    setWordCountFilter('all');
    onSelectIntentFilter('all');
    setCurrentPage(1);
    showNotice('All search filters reset');
  };

  // Parse negative keywords list
  const negativeKeywords = useMemo(() => {
    return negativeKeywordsInput
      .split(/[\n,]/)
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
  }, [negativeKeywordsInput]);

  // Listen for quick-add negative keywords from cluster insights
  React.useEffect(() => {
    const handleAddNeg = (e: any) => {
      if (e.detail) {
        addWordsToNegativeFilter([e.detail]);
      }
    };
    window.addEventListener('add-negative-kw', handleAddNeg);
    return () => window.removeEventListener('add-negative-kw', handleAddNeg);
  }, [negativeKeywordsInput]);

  const addWordsToNegativeFilter = (wordsToAdd: string[]) => {
    setNegativeKeywordsInput((prev) => {
      const existing = prev
        .split(/[\n,]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      
      const newItems = wordsToAdd.map((w) => w.trim().toLowerCase()).filter((w) => !existing.includes(w));
      if (newItems.length === 0) return prev;
      
      return existing.length > 0 ? `${existing.join(', ')}, ${newItems.join(', ')}` : newItems.join(', ');
    });
    setCurrentPage(1);
    showNotice(`Added ${wordsToAdd.length} terms to Negative Filters`);
  };

  // Filter and Sort Data
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      const kwLower = item.keyword.toLowerCase();

      // Live search filter
      if (searchTerm.trim() && !kwLower.includes(searchTerm.trim().toLowerCase())) {
        return false;
      }

      // Negative keyword exclusions
      if (negativeKeywords.length > 0) {
        for (const neg of negativeKeywords) {
          if (kwLower.includes(neg)) {
            return false;
          }
        }
      }

      // Intent filter
      if (activeIntentFilter !== 'all' && item.intent !== activeIntentFilter) {
        return false;
      }

      // Platform filter
      if (platformFilter !== 'all' && item.platform !== platformFilter) {
        return false;
      }

      // Word count filter
      if (wordCountFilter === 'short' && item.wordCount > 2) return false;
      if (wordCountFilter === 'medium' && (item.wordCount < 3 || item.wordCount > 4)) return false;
      if (wordCountFilter === 'long' && item.wordCount < 5) return false;

      return true;
    });
  }, [results, searchTerm, negativeKeywords, activeIntentFilter, platformFilter, wordCountFilter]);

  // Sorted data
  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'keyword') {
        comparison = a.keyword.localeCompare(b.keyword);
      } else if (sortField === 'platform') {
        comparison = a.platform.localeCompare(b.platform);
      } else if (sortField === 'intent') {
        comparison = a.intent.localeCompare(b.intent);
      } else if (sortField === 'wordCount') {
        comparison = a.wordCount - b.wordCount;
      } else if (sortField === 'discoveredAt') {
        comparison = a.discoveredAt - b.discoveredAt;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredResults, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(sortedResults.length / pageSize));
  const paginatedResults = useMemo(() => {
    if (pageSize === -1) return sortedResults;
    const start = (currentPage - 1) * pageSize;
    return sortedResults.slice(start, start + pageSize);
  }, [sortedResults, currentPage, pageSize]);

  // Toggle selection
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllCurrentPage = () => {
    const next = new Set(selectedIds);
    const allSelected = paginatedResults.length > 0 && paginatedResults.every((r) => next.has(r.id));
    if (allSelected) {
      paginatedResults.forEach((r) => next.delete(r.id));
    } else {
      paginatedResults.forEach((r) => next.add(r.id));
    }
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set<string>();
    filteredResults.forEach((r) => next.add(r.id));
    setSelectedIds(next);
  };

  const selectAllTotalMined = () => {
    const next = new Set<string>();
    results.forEach((r) => next.add(r.id));
    setSelectedIds(next);
    showNotice(`Selected all ${results.length} mined terms`);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Quick single copy
  const copyKeyword = (keyword: string, id: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Target keywords for actions: if selections exist, use selections; otherwise use current filtered view
  const getTargetKeywords = () => {
    if (selectedIds.size > 0) {
      return results.filter((r) => selectedIds.has(r.id));
    }
    return filteredResults;
  };

  // 1. Export CSV
  const exportCSV = (useSelectionOnly: boolean = false) => {
    const target = useSelectionOnly && selectedIds.size > 0 
      ? results.filter((r) => selectedIds.has(r.id))
      : getTargetKeywords();
    
    if (target.length === 0) return;

    const headers = ['Keyword', 'Platform', 'Intent', 'Word Count', 'Character Count', 'Modifier Type', 'Seed'];
    const rows = target.map((r) => [
      `"${r.keyword.replace(/"/g, '""')}"`,
      r.platform,
      r.intent,
      r.wordCount,
      r.charCount,
      r.modifierType,
      `"${r.rootSeed.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `keywords_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotice(`Exported ${target.length} keywords to CSV`);
  };

  // 2. Export Fast Structured JSON
  const exportJSON = (useSelectionOnly: boolean = false) => {
    const target = useSelectionOnly && selectedIds.size > 0 
      ? results.filter((r) => selectedIds.has(r.id))
      : getTargetKeywords();
    
    if (target.length === 0) return;

    const cleanData = target.map((item) => ({
      keyword: item.keyword,
      platform: item.platform,
      intent: item.intent,
      wordCount: item.wordCount,
      modifier: item.modifierType,
    }));

    const jsonString = JSON.stringify(cleanData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `keywords_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotice(`Exported ${target.length} keywords to JSON`);
  };

  // 3. Copy Formatted (Plain, Notion, Google Ads match types)
  const copyFormatted = (
    format: 'plain' | 'notion' | 'ads_exact' | 'ads_phrase' | 'ads_broad' | 'ads_modified_broad',
    useSelectionOnly: boolean = false
  ) => {
    const target = useSelectionOnly && selectedIds.size > 0 
      ? results.filter((r) => selectedIds.has(r.id))
      : getTargetKeywords();
    
    if (target.length === 0) return;

    let output = '';
    let formatLabel = '';

    if (format === 'plain') {
      output = target.map((r) => r.keyword).join('\n');
      formatLabel = 'Plain Text (1/line)';
    } else if (format === 'notion') {
      output = `| Keyword | Platform | Intent |\n| :--- | :--- | :--- |\n` +
        target.map((r) => `| ${r.keyword} | ${r.platform.charAt(0).toUpperCase() + r.platform.slice(1)} | ${r.intent.charAt(0).toUpperCase() + r.intent.slice(1)} |`).join('\n');
      formatLabel = 'Notion Table';
    } else if (format === 'ads_exact') {
      output = target.map((r) => `[${r.keyword}]`).join('\n');
      formatLabel = 'Google Ads [Exact Match]';
    } else if (format === 'ads_phrase') {
      output = target.map((r) => `"${r.keyword}"`).join('\n');
      formatLabel = 'Google Ads "Phrase Match"';
    } else if (format === 'ads_broad') {
      output = target.map((r) => r.keyword).join('\n');
      formatLabel = 'Google Ads Broad Match';
    } else if (format === 'ads_modified_broad') {
      output = target.map((r) => `+${r.keyword.split(/\s+/).join(' +')}`).join('\n');
      formatLabel = 'Google Ads +Modified +Broad';
    }

    navigator.clipboard.writeText(output);
    setShowAdsMenu(false);
    showNotice(`Copied ${target.length} keywords (${formatLabel}) to clipboard!`);
  };

  // 4. Bulk Add Selected to Negative Keywords
  const handleAddSelectedToNegatives = () => {
    if (selectedIds.size === 0) return;
    const selectedKeywords = results
      .filter((r) => selectedIds.has(r.id))
      .map((r) => r.keyword);
    
    addWordsToNegativeFilter(selectedKeywords);
    setSelectedIds(new Set());
  };

  // 5. Bulk Delete Selected
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    onDeleteKeywords(Array.from(selectedIds));
    setSelectedIds(new Set());
    showNotice(`Deleted ${selectedIds.size} keywords`);
  };

  const showNotice = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 3500);
  };

  // Helper SERP link generator
  const getSearchUrl = (platform: Platform, query: string) => {
    if (platform === 'youtube') return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    if (platform === 'amazon') return `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  };

  if (results.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400 mb-4">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-200">No Keywords Mined Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Enter seed keywords above and click <strong className="text-amber-400">"Start Mining"</strong> to extract hundreds of long-tail search queries in real time.
        </p>
      </div>
    );
  }

  const allPageSelected = paginatedResults.length > 0 && paginatedResults.every((r) => selectedIds.has(r.id));

  return (
    <div className="bg-gray-900/95 border border-gray-800 rounded-2xl shadow-xl shadow-black/40 overflow-hidden backdrop-blur-md relative">
      {/* Toast notification banner */}
      {exportNotice && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{exportNotice}</span>
          </div>
          <button type="button" onClick={() => setExportNotice(null)} className="text-emerald-400 hover:text-emerald-200 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Table Header Controls & Search Filters */}
      <div className="p-4 sm:p-5 border-b border-gray-800 bg-gray-950/40 space-y-3.5">
        {/* Search & Negative Keyword Inputs + Clear Filters Reset */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Live Search */}
          <div className={`${hasActiveFilters ? 'md:col-span-5' : 'md:col-span-6'} relative`}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="results-search-filter"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Instant keyword search..."
              className="w-full bg-gray-950 border border-gray-700/80 rounded-xl pl-9.5 pr-8 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Negative Keyword Filter */}
          <div className={`${hasActiveFilters ? 'md:col-span-5' : 'md:col-span-6'} relative`}>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-rose-400 font-bold text-xs">
              <span>-</span>
            </div>
            <input
              id="negative-keyword-filter"
              type="text"
              value={negativeKeywordsInput}
              onChange={(e) => {
                setNegativeKeywordsInput(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Negative keywords to exclude (e.g. free, crack, login)..."
              className="w-full bg-gray-950 border border-gray-700/80 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/70 focus:ring-1 focus:ring-rose-500/30"
            />
            {negativeKeywordsInput && (
              <button
                type="button"
                onClick={() => setNegativeKeywordsInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Reset All Filters Button */}
          {hasActiveFilters && (
            <div className="md:col-span-2">
              <button
                type="button"
                id="clear-all-filters-btn"
                onClick={handleClearAllFilters}
                title="Reset search, negative keywords, intent, platform, and word count filters"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Filters ({activeFilterCount})</span>
              </button>
            </div>
          )}
        </div>

        {/* Secondary Filter Chips Row & Standard Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Platform & Word Count Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              Filters:
            </span>

            {/* Platform Filter */}
            <div className="inline-flex bg-gray-950 p-0.5 rounded-lg border border-gray-800 text-[11px]">
              <button
                type="button"
                onClick={() => { setPlatformFilter('all'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${platformFilter === 'all' ? 'bg-gray-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All Platforms
              </button>
              <button
                type="button"
                onClick={() => { setPlatformFilter('google'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${platformFilter === 'google' ? 'bg-blue-950 text-blue-300 font-bold border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => { setPlatformFilter('youtube'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${platformFilter === 'youtube' ? 'bg-red-950 text-red-300 font-bold border border-red-500/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                YouTube
              </button>
              <button
                type="button"
                onClick={() => { setPlatformFilter('amazon'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${platformFilter === 'amazon' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Amazon
              </button>
            </div>

            {/* Word Length Filter */}
            <div className="inline-flex bg-gray-950 p-0.5 rounded-lg border border-gray-800 text-[11px]">
              <button
                type="button"
                onClick={() => { setWordCountFilter('all'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${wordCountFilter === 'all' ? 'bg-gray-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All Lengths
              </button>
              <button
                type="button"
                onClick={() => { setWordCountFilter('short'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${wordCountFilter === 'short' ? 'bg-gray-800 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                1-2 words
              </button>
              <button
                type="button"
                onClick={() => { setWordCountFilter('medium'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${wordCountFilter === 'medium' ? 'bg-gray-800 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                3-4 words
              </button>
              <button
                type="button"
                onClick={() => { setWordCountFilter('long'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${wordCountFilter === 'long' ? 'bg-gray-800 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                5+ words
              </button>
            </div>

            {/* Intent Filter Active Chip */}
            {activeIntentFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] flex items-center gap-1 font-medium">
                <span>Intent: {activeIntentFilter}</span>
                <button
                  type="button"
                  onClick={() => onSelectIntentFilter('all')}
                  className="hover:text-blue-100 cursor-pointer ml-1"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {/* Right: Export Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Export CSV */}
            <button
              id="export-csv-button"
              type="button"
              onClick={() => exportCSV(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-slate-200 border border-gray-700 font-semibold transition-colors cursor-pointer text-xs"
              title="Export filtered keywords as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Export JSON */}
            <button
              id="export-json-button"
              type="button"
              onClick={() => exportJSON(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-slate-200 border border-gray-700 font-semibold transition-colors cursor-pointer text-xs"
              title="Export structured JSON array with keyword, platform, intent, wordCount, modifier"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </button>

            {/* Copy Formatted / Ads Toolbar */}
            <div className="relative inline-flex rounded-lg shadow-sm">
              <button
                id="copy-clipboard-button"
                type="button"
                onClick={() => copyFormatted('plain', false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-colors cursor-pointer text-xs"
                title="Copy clean plain text list (1 keyword per line)"
              >
                <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                <span>Copy List</span>
              </button>

              {/* Google Ads match type dropdown */}
              <div className="relative">
                <button
                  id="copy-ads-match-type-btn"
                  type="button"
                  onClick={() => setShowAdsMenu(!showAdsMenu)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-y border-r border-amber-500/40 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                  title="Choose Google Ads Match Type formatting"
                >
                  <span>Ads [ ]</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showAdsMenu && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-gray-950 border border-amber-500/40 rounded-xl shadow-2xl z-50 py-1.5 text-xs animate-in fade-in">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-gray-800">
                      Google Ads Match Types
                    </div>
                    <button
                      type="button"
                      onClick={() => copyFormatted('ads_exact', false)}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/20 text-amber-300 flex items-center justify-between cursor-pointer font-mono"
                    >
                      <span>[Exact Match]</span>
                      <span className="text-[10px] text-slate-400">[kw]</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyFormatted('ads_phrase', false)}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/20 text-amber-300 flex items-center justify-between cursor-pointer font-mono"
                    >
                      <span>"Phrase Match"</span>
                      <span className="text-[10px] text-slate-400">"kw"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyFormatted('ads_modified_broad', false)}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/20 text-amber-300 flex items-center justify-between cursor-pointer font-mono"
                    >
                      <span>+Modified +Broad</span>
                      <span className="text-[10px] text-slate-400">+w1 +w2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyFormatted('ads_broad', false)}
                      className="w-full text-left px-3 py-1.5 hover:bg-amber-500/20 text-amber-300 flex items-center justify-between cursor-pointer font-mono"
                    >
                      <span>Standard Broad</span>
                      <span className="text-[10px] text-slate-400">kw</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                id="copy-notion-table"
                type="button"
                title="Copy formatted as Notion Markdown Table"
                onClick={() => copyFormatted('notion', false)}
                className="px-2.5 py-1.5 rounded-r-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-y border-r border-amber-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Notion
              </button>
            </div>
          </div>
        </div>

        {/* Selection Strip & "Select All Mined Terms" Shortcut */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-gray-800/80 gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Page selection checkbox */}
            <button
              type="button"
              onClick={selectAllCurrentPage}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white font-medium cursor-pointer"
            >
              {allPageSelected ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>Select Page ({paginatedResults.length})</span>
            </button>

            {/* Select All Mined Terms Shortcut */}
            <button
              type="button"
              id="select-all-mined-terms-btn"
              onClick={selectAllTotalMined}
              className="px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 hover:border-amber-500/50 text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 text-[11px]"
              title="Select all mined terms across all pages"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Select All {results.length} Mined Terms</span>
            </button>

            {selectedIds.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-amber-400 hover:underline cursor-pointer text-xs font-medium"
                >
                  Select All {filteredResults.length} Matching Filter
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer text-xs"
                >
                  Deselect All
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs">
              Showing <strong className="text-slate-200">{filteredResults.length}</strong> of {results.length} terms
            </span>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-950 border-b border-gray-700 text-gray-400 font-semibold tracking-wider uppercase text-[11px]">
              <th className="py-2 px-3 w-10">
                <span className="sr-only">Select</span>
              </th>
              <th 
                className="py-2 px-3 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('keyword')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Keyword Query</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                className="py-2 px-3 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('platform')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Platform</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                className="py-2 px-3 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('intent')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Estimated Intent</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th 
                className="py-2 px-3 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('wordCount')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Word Count</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-2 px-3 text-slate-400">
                <span>Modifier</span>
              </th>
              <th className="py-2 px-3 text-right">
                <span>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#374151]/50 font-sans">
            {paginatedResults.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const intentStyle = getIntentColor(item.intent);
              const isCopied = copiedId === item.id;

              return (
                <tr
                  key={item.id}
                  className={`group transition-colors border-b border-[#374151]/40 ${
                    isSelected ? 'bg-amber-500/15' : 'hover:bg-gray-800/60'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-1.5 px-3">
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      className="text-slate-500 hover:text-amber-400 cursor-pointer block"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                      )}
                    </button>
                  </td>

                  {/* Keyword text + search SERP link */}
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-2 max-w-md">
                      <span className="font-semibold text-slate-100 group-hover:text-amber-200 transition-colors leading-tight">
                        {item.keyword}
                      </span>
                      <a
                        href={getSearchUrl(item.platform, item.keyword)}
                        target="_blank"
                        rel="noreferrer"
                        title="View SERP search results in new tab"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-300 transition-opacity"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>

                  {/* Platform Badge */}
                  <td className="py-1.5 px-3">
                    {item.platform === 'google' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-500/30 text-[11px] font-medium leading-none">
                        Google
                      </span>
                    )}
                    {item.platform === 'youtube' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950 text-red-300 border border-red-500/30 text-[11px] font-medium leading-none">
                        <Youtube className="w-3 h-3" />
                        YouTube
                      </span>
                    )}
                    {item.platform === 'amazon' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-500/30 text-[11px] font-medium leading-none">
                        <ShoppingBag className="w-3 h-3" />
                        Amazon
                      </span>
                    )}
                  </td>

                  {/* Estimated Intent Badge */}
                  <td className="py-1.5 px-3">
                    <button
                      type="button"
                      onClick={() => onSelectIntentFilter(item.intent)}
                      title={`Filter by ${item.intent} intent`}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${intentStyle.bg} ${intentStyle.text} ${intentStyle.border} leading-none cursor-pointer hover:opacity-90 transition-opacity`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${intentStyle.dot}`}></span>
                      <span>{item.intent}</span>
                    </button>
                  </td>

                  {/* Word Count */}
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-200 tabular-nums">
                        {item.wordCount}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({item.charCount}c)
                      </span>
                    </div>
                  </td>

                  {/* Modifier type */}
                  <td className="py-1.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-gray-950 border border-gray-800 text-[10px] font-mono text-slate-400 uppercase">
                      {item.modifierType.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Row Actions */}
                  <td className="py-1.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => copyKeyword(item.keyword, item.id)}
                        title="Copy keyword"
                        className="p-1 rounded-md text-slate-400 hover:text-amber-300 hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteKeywords([item.id])}
                        title="Remove row"
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-3.5 sm:p-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-gray-950/40">
        {/* Page size dropdown */}
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-gray-950 border border-gray-700/80 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={-1}>All ({sortedResults.length})</option>
          </select>
        </div>

        {/* Page navigation */}
        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span>
              Page <strong className="text-slate-200">{currentPage}</strong> of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-gray-950 border border-gray-800 disabled:opacity-30 hover:bg-gray-800 text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-gray-950 border border-gray-800 disabled:opacity-30 hover:bg-gray-800 text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Sticky Floating "Bulk Actions" Toolbar at Bottom of Viewport */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl bg-gray-950/95 border-2 border-amber-500/70 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black/80 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200 ring-1 ring-amber-400/30">
          {/* Left: Selected count & quick selection */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold text-xs shadow-inner">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <span>{selectedIds.size} Selected</span>
            </span>

            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer hidden sm:inline"
            >
              Select All {filteredResults.length} Matching
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Deselect
            </button>
          </div>

          {/* Right: Bulk Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Copy Selected (Plain) */}
            <button
              type="button"
              id="bulk-copy-plain"
              onClick={() => copyFormatted('plain', true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title="Copy selected keywords as plain text (1 keyword per line)"
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
              <span>Copy Selected (Plain)</span>
            </button>

            {/* 2. Copy Selected (Notion Format) */}
            <button
              type="button"
              id="bulk-copy-notion"
              onClick={() => copyFormatted('notion', true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-200 border border-gray-700 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title="Copy selected keywords as formatted Notion Markdown table"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy (Notion)</span>
            </button>

            {/* 3. Add Selected to Negative Filters */}
            <button
              type="button"
              id="bulk-add-negatives"
              onClick={handleAddSelectedToNegatives}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title="Add all selected keywords into the Negative Keywords exclusion filter"
            >
              <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Add to Negative Filters</span>
            </button>

            {/* 4. Export Selected (CSV) */}
            <button
              type="button"
              id="bulk-export-csv"
              onClick={() => exportCSV(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-slate-200 border border-gray-700 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title="Export only selected keywords to CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* 5. Delete Selected */}
            <button
              type="button"
              id="bulk-delete-selected"
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 text-xs font-semibold cursor-pointer shadow-sm transition-all"
              title="Delete all selected keywords"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
