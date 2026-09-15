'use client';

import { useState, useCallback } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { SourceFilter } from '@/components/SourceFilter';
import { ResultCard } from '@/components/ResultCard';
import { SearchResult, SourceId, AVAILABLE_SOURCES } from '@/lib/types';

const ALL_SOURCES = AVAILABLE_SOURCES.map(s => s.id) as SourceId[];
const JA_SOURCES: SourceId[] = ['openalex', 'cinii'];
const EN_SOURCES: SourceId[] = ['openalex', 'arxiv', 'semanticscholar', 'pubmed'];

function isJapanese(q: string): boolean {
  return /[぀-鿿]/.test(q);
}

export default function Page() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<SourceId[]>(ALL_SOURCES);
  const [autoMode, setAutoMode] = useState(true);

  const handleSearch = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    setLastQuery(q);

    const effectiveSources = autoMode
      ? (isJapanese(q) ? JA_SOURCES : EN_SOURCES)
      : selected;

    try {
      const params = new URLSearchParams({ q, sources: effectiveSources.join(',') });
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '検索に失敗しました');
      setResults(data.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">Research Search</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">PDF付き学術論文・文書を横断検索</p>
            </div>
          </div>
          <SearchBar onSearch={handleSearch} loading={loading} defaultValue={lastQuery} />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoMode(m => !m)}
              className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                autoMode
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}
            >
              {autoMode ? '自動選択中' : '手動選択'}
            </button>
            {autoMode ? (
              <p className="text-xs text-gray-400">
                日本語クエリ → OpenAlex (日本語) + CiNii / 英語クエリ → OpenAlex + arXiv + Semantic Scholar + PubMed
              </p>
            ) : (
              <SourceFilter selected={selected} onChange={setSelected} disabled={loading} />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Initial state */}
        {!searched && (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">論文・文書をPDFで探す</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8">
              複数のデータベースを同時に検索し、PDFでダウンロードできる文献のみを表示します
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto text-left">
              {AVAILABLE_SOURCES.map(src => (
                <div key={src.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-sm font-medium text-gray-700">{src.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{src.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">{selected.length}つのデータベースを検索中…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-12 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* No results */}
        {!loading && !error && searched && results.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">「{lastQuery}」のPDF付き文献が見つかりませんでした</p>
            <p className="text-xs text-gray-400 mt-1">別のキーワードや検索ソースをお試しください</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-4">
              PDFダウンロード可能な文献 <span className="font-medium text-gray-600">{results.length}件</span>
            </p>
            <div className="space-y-3">
              {results.map(r => (
                <ResultCard key={r.id} result={r} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
