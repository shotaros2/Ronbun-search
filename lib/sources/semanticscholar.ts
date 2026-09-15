import { SearchResult } from '../types';

export async function searchSemanticScholar(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    query,
    limit: '10',
    fields: 'title,authors,year,abstract,openAccessPdf,externalIds,publicationVenue,citationCount',
  });

  const res = await fetch(
    `https://api.semanticscholar.org/graph/v1/paper/search?${params}`,
    {
      cache: 'no-store',
      headers: { 'User-Agent': 'ResearchSearch/1.0 (tofurosaya@gmail.com)' },
    }
  );
  if (!res.ok) throw new Error(`SemanticScholar ${res.status}`);

  const data = await res.json();

  return (data.data ?? [])
    .filter((p: any) => p.openAccessPdf?.url)
    .map((p: any): SearchResult => ({
      id: `ss-${p.paperId}`,
      title: p.title ?? '(タイトルなし)',
      authors: (p.authors ?? []).slice(0, 5).map((a: any) => a.name),
      year: p.year ?? null,
      abstract: (p.abstract ?? '').slice(0, 500),
      source: 'Semantic Scholar',
      sourceType: 'academic',
      pdfUrl: p.openAccessPdf.url,
      doi: p.externalIds?.DOI,
      url: `https://www.semanticscholar.org/paper/${p.paperId}`,
      journal: p.publicationVenue?.name,
      citations: p.citationCount,
    }));
}
