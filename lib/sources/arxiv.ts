import { SearchResult } from '../types';

function xmlText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

export async function searchArxiv(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: '0',
    max_results: '10',
    sortBy: 'relevance',
  });

  const res = await fetch(`https://export.arxiv.org/api/query?${params}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'ResearchSearch/1.0 (tofurosaya@gmail.com)' },
  });
  if (!res.ok) throw new Error(`arXiv ${res.status}`);

  const xml = await res.text();
  const results: SearchResult[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;

  while ((m = entryRe.exec(xml)) !== null) {
    const entry = m[1];

    const rawId = xmlText(entry, 'id');
    const arxivId = rawId.split('/abs/').pop()?.split('/').pop() ?? rawId.split('/').pop() ?? '';
    if (!arxivId) continue;

    const title = xmlText(entry, 'title').replace(/\s+/g, ' ');
    if (!title) continue;

    const pdfLinkMatch =
      entry.match(/<link[^>]+type="application\/pdf"[^>]+href="([^"]+)"/) ??
      entry.match(/<link[^>]+href="([^"]+)"[^>]+type="application\/pdf"/);
    const pdfUrl = pdfLinkMatch?.[1] ?? `https://arxiv.org/pdf/${arxivId}`;

    const authors: string[] = [];
    const authorRe = /<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g;
    let am: RegExpExecArray | null;
    while ((am = authorRe.exec(entry)) !== null) authors.push(am[1]);

    const published = xmlText(entry, 'published');
    const year = published ? parseInt(published.slice(0, 4)) : null;

    results.push({
      id: `arxiv-${arxivId}`,
      title,
      authors: authors.slice(0, 5),
      year,
      abstract: xmlText(entry, 'summary').replace(/\s+/g, ' ').slice(0, 500),
      source: 'arXiv',
      sourceType: 'preprint',
      pdfUrl,
      doi: xmlText(entry, 'arxiv:doi') || undefined,
      url: `https://arxiv.org/abs/${arxivId}`,
    });
  }

  return results;
}
