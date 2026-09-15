import { SearchResult } from '../types';

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export async function searchPubMed(query: string): Promise<SearchResult[]> {
  const searchParams = new URLSearchParams({
    db: 'pmc',
    term: `${query} AND open access[filter]`,
    retmax: '10',
    retmode: 'json',
  });

  const searchRes = await fetch(`${BASE}/esearch.fcgi?${searchParams}`, { cache: 'no-store' });
  if (!searchRes.ok) throw new Error(`PubMed search ${searchRes.status}`);

  const searchData = await searchRes.json();
  const ids: string[] = searchData.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summaryParams = new URLSearchParams({
    db: 'pmc',
    id: ids.join(','),
    retmode: 'json',
  });

  const summaryRes = await fetch(`${BASE}/esummary.fcgi?${summaryParams}`, { cache: 'no-store' });
  if (!summaryRes.ok) throw new Error(`PubMed summary ${summaryRes.status}`);

  const summaryData = await summaryRes.json();
  const uids: string[] = summaryData.result?.uids ?? ids;
  const results: SearchResult[] = [];

  for (const id of uids) {
    const doc = summaryData.result?.[id];
    if (!doc?.title) continue;

    const pmcid = `PMC${id}`;
    const year = doc.pubdate ? parseInt(doc.pubdate.slice(0, 4)) : null;

    results.push({
      id: `pubmed-${pmcid}`,
      title: doc.title,
      authors: (doc.authors ?? []).slice(0, 5).map((a: any) => a.name),
      year: isNaN(year as number) ? null : year,
      abstract: '',
      source: 'PubMed Central',
      sourceType: 'academic',
      pdfUrl: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/pdf/`,
      url: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`,
      journal: doc.fulljournalname ?? doc.source,
    });
  }

  return results;
}
