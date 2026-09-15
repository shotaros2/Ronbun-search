import { SearchResult } from '../types';

function xmlText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

export async function searchJStage(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ text: query, count: '10', startItem: '1' });
  const res = await fetch(
    `https://api.jstage.jst.go.jp/api/search/v2/article?${params}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`J-STAGE ${res.status}`);

  const xml = await res.text();
  const results: SearchResult[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;

  while ((m = entryRe.exec(xml)) !== null) {
    const entry = m[1];
    const title = xmlText(entry, 'title');
    if (!title) continue;

    const pdfLinkMatch =
      entry.match(/<link[^>]+type="application\/pdf"[^>]+href="([^"]+)"/) ??
      entry.match(/<link[^>]+href="([^"]+)"[^>]+type="application\/pdf"/);
    const pdfUrl = pdfLinkMatch?.[1];
    if (!pdfUrl) continue;

    const authors: string[] = [];
    const nameRe = /<name>([^<]+)<\/name>/g;
    let am: RegExpExecArray | null;
    while ((am = nameRe.exec(entry)) !== null) authors.push(am[1]);

    const pubMatch = entry.match(/<published>(\d{4})/);
    const year = pubMatch ? parseInt(pubMatch[1]) : null;

    const urlMatch =
      entry.match(/<link[^>]+rel="alternate"[^>]+href="([^"]+)"/) ??
      entry.match(/<id>([^<]+)<\/id>/);
    const articleUrl = urlMatch?.[1] ?? '';

    const rawId = xmlText(entry, 'id') || title;

    results.push({
      id: `jstage-${encodeURIComponent(rawId).slice(0, 80)}`,
      title,
      authors: authors.slice(0, 5),
      year,
      abstract: xmlText(entry, 'summary').slice(0, 500),
      source: 'J-STAGE',
      sourceType: 'academic',
      pdfUrl,
      url: articleUrl,
    });
  }

  return results;
}
