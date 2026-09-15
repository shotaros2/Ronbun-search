import { SearchResult } from '../types';

function reconstructAbstract(invertedIndex: Record<string, number[]> | null): string {
  if (!invertedIndex) return '';
  const words: [string, number][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([word, pos]);
    }
  }
  words.sort((a, b) => a[1] - b[1]);
  return words.map(w => w[0]).join(' ').slice(0, 500);
}

function isJapanese(query: string): boolean {
  return /[぀-鿿]/.test(query);
}

export async function searchOpenAlex(query: string): Promise<SearchResult[]> {
  const jaFilter = isJapanese(query) ? ',language:ja' : '';
  const params = new URLSearchParams({
    search: query,
    filter: `has_oa_accepted_or_published_version:true${jaFilter}`,
    'per-page': '15',
    mailto: 'tofurosaya@gmail.com',
    select: 'id,title,authorships,publication_year,abstract_inverted_index,open_access,doi,primary_location,cited_by_count',
  });

  const res = await fetch(`https://api.openalex.org/works?${params}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'ResearchSearch/1.0 (tofurosaya@gmail.com)' },
  });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);

  const data = await res.json();

  return (data.results ?? [])
    .filter((w: any) => w.open_access?.oa_url)
    .map((w: any): SearchResult => ({
      id: `openalex-${w.id}`,
      title: w.title ?? '(タイトルなし)',
      authors: (w.authorships ?? []).slice(0, 5).map((a: any) => a.author?.display_name).filter(Boolean),
      year: w.publication_year ?? null,
      abstract: reconstructAbstract(w.abstract_inverted_index),
      source: 'OpenAlex',
      sourceType: 'academic',
      pdfUrl: w.open_access.oa_url,
      doi: w.doi?.replace('https://doi.org/', ''),
      url: w.primary_location?.landing_page_url ?? w.id,
      journal: w.primary_location?.source?.display_name,
      citations: w.cited_by_count,
    }));
}
