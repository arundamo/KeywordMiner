import React, { useState, useMemo } from 'react';
import { Layers, Hash, Plus, Sparkles, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { KeywordResult } from '../types';

interface KeywordClustersProps {
  results: KeywordResult[];
  onAddNegativeKeyword: (word: string) => void;
}

export const KeywordClusters: React.FC<KeywordClustersProps> = ({
  results,
  onAddNegativeKeyword,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Extract top individual words (excluding tiny stopwords)
  const topWords = useMemo(() => {
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'a', 'an', 'in', 'on', 'at', 'to', 'of', 'is', 'are', 'how', 'why', 'what'
    ]);
    const wordCounts: Record<string, number> = {};

    for (const r of results) {
      const words = r.keyword.toLowerCase().split(/[\s,.-]+/).filter((w) => w.length > 2 && !stopWords.has(w));
      for (const w of words) {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      }
    }

    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 18);
  }, [results]);

  // Extract top 2-word bigrams for thematic clustering
  const topBigrams = useMemo(() => {
    const bigramCounts: Record<string, number> = {};

    for (const r of results) {
      const words = r.keyword.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        bigramCounts[bigram] = (bigramCounts[bigram] || 0) + 1;
      }
    }

    return Object.entries(bigramCounts)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [results]);

  if (results.length < 5) return null;

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all">
      {/* Collapsible Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
          title={isExpanded ? 'Collapse Cluster Intelligence' : 'Expand Cluster Intelligence'}
        >
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
            <Hash className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 group-hover:text-amber-300 transition-colors">
                N-Gram Cluster Intelligence & Word Frequency
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {topWords.length + topBigrams.length} clusters
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Click any single term or 2-word phrase to instantly add it to Negative Keywords
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Hide</span>
                <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Show</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-800 animate-in fade-in duration-200">
          {/* Top frequent terms */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Most Frequent Words
              </span>
              <span className="text-[10px] text-slate-500">Click to exclude</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topWords.map(([word, count]) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => onAddNegativeKeyword(word)}
                  title={`Click to add "${word}" to negative keyword filter`}
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-950 hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 border border-gray-800 hover:border-rose-500/40 text-xs transition-all cursor-pointer shadow-sm"
                >
                  <span>{word}</span>
                  <span className="font-mono text-[10px] text-amber-400 group-hover:text-rose-300 font-bold tabular-nums">
                    {count}
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-rose-300">✕</span>
                </button>
              ))}
            </div>
          </div>

          {/* Top 2-word phrase patterns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Frequent 2-Word Patterns
              </span>
              <span className="text-[10px] text-slate-500">Click to exclude</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topBigrams.map(([phrase, count]) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => onAddNegativeKeyword(phrase)}
                  title={`Click to add "${phrase}" to negative keyword filter`}
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-950 hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 border border-gray-800 hover:border-rose-500/40 text-xs transition-all cursor-pointer shadow-sm"
                >
                  <span>{phrase}</span>
                  <span className="font-mono text-[10px] text-cyan-400 group-hover:text-rose-300 font-bold tabular-nums">
                    {count}×
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-rose-300">✕</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
