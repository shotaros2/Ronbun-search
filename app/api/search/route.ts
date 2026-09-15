import { NextRequest, NextResponse } from 'next/server';
import { searchOpenAlex } from '@/lib/sources/openalex';
import { searchArxiv } from '@/lib/sources/arxiv';
import { searchSemanticScholar } from '@/lib/sources/semanticscholar';
import { searchPubMed } from '@/lib/sources/pubmed';
import { searchCiNii } from '@/lib/sources/cinii';
import { SearchResult } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

const HANDLERS: Record<string, (q: string) => Promise<SearchResult[]>> = {
  openalex: searchOpenAlex,
  arxiv: searchArxiv,
  semanticscholar: searchSemanticScholar,
  pubmed: searchPubMed,
  cinii: searchCiNii,
};

function isJapanese(query: string): boolean {
  return /[぀-鿿]/.test(query);
}

const JA_SOURCES = new Set(['openalex', 'cinii']);
const EN_SOURCES = new Set(['openalex', 'arxiv', 'semanticscholar', 'pubmed']);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  const sourcesParam = req.nextUrl.searchParams.get('sources');

  if (!q) return NextResponse.json({ error: 'クエリが必要です' }, { status: 400 });

  const ja = isJapanese(q);
  const defaultSources = ja ? [...JA_SOURCES] : [...EN_SOURCES];
  const sources = sourcesParam ? sourcesParam.split(',') : defaultSources;

  const promises = sources
    .filter(s => HANDLERS[s])
    .map(s =>
      withTimeout(HANDLERS[s](q), 12000).catch(err => {
        console.error(`[${s}] error:`, err.message);
        return [] as SearchResult[];
      })
    );

  const batches = await Promise.all(promises);
  const all = batches.flat();

  const seen = new Set<string>();
  const deduped = all.filter(r => {
    const key = r.doi ? `doi:${r.doi.toLowerCase()}` : `id:${r.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => {
    const yearDiff = (b.year ?? 0) - (a.year ?? 0);
    if (yearDiff !== 0) return yearDiff;
    return (b.citations ?? 0) - (a.citations ?? 0);
  });

  return NextResponse.json({ results: deduped, total: deduped.length });
}
