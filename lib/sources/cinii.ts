import { SearchResult } from '../types';

function xmlText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function xmlAttr(xml: string, tag: string, attr: string, attrVal: string): string {
  const re = new RegExp(
    `<${tag}[^>]*${attr}="${attrVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([^<]*)<\\/${tag}>`,
    'i'
  );
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

export async function searchCiNii(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    count: '20',
    format: 'atom',
    sortorder: '0',
  });

  const res = await fetch(
    `https://cir.nii.ac.jp/opensearch/articles?${params}`,
    {
      cache: 'no-store',
      headers: { 'User-Agent': 'ResearchSearch/1.0 (tofurosaya@gmail.com)' },
    }
  );
  if (!res.ok) throw new Error(`CiNii ${res.status}`);

  const xml = await res.text();
  const results: SearchResult[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m: RegExpExecArray | null;

  while ((m = entryRe.exec(xml)) !== null) {
    const entry = m[1];

    const title = xmlText(entry, 'title');
    if (!title) continue;

    // タイトルに検索語が含まれない場合はスキップ（subject/キーワードタグのみマッチした無関係論文を排除）
    const queryTerms = query.split(/\s+/).filter(t => t.length > 0);
    const titleLower = title.toLowerCase();
    if (queryTerms.length > 0 && !queryTerms.some(t => titleLower.includes(t.toLowerCase()))) continue;

    // IR (機関リポジトリ) の URI を PDF ダウンロード先として使用
    const irUri = xmlAttr(entry, 'dc:identifier', 'rdf:datatype', 'cir:URI');
    if (!irUri) continue; // IR URIがない場合はスキップ（OA保証なし）
    if (/ndl\.go\.jp/i.test(irUri)) continue; // 国会図書館はネット上でDL不可

    const ciniiUrl = entry.match(/<link href="(https:\/\/cir\.nii\.ac\.jp\/crid\/[^"]+)"/)?.[1] ?? '';

    const doi = xmlAttr(entry, 'dc:identifier', 'rdf:datatype', 'cir:DOI') || undefined;

    // 著者
    const authors: string[] = [];
    const nameRe = /<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g;
    let am: RegExpExecArray | null;
    while ((am = nameRe.exec(entry)) !== null) authors.push(am[1]);

    // 年
    const dateStr = xmlText(entry, 'prism:publicationDate');
    const year = dateStr ? parseInt(dateStr.slice(0, 4)) : null;

    // 抄録（HTMLエスケープ解除）
    const rawContent = xmlText(entry, 'content');
    const abstract = rawContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/<[^>]+>/g, '')
      .trim()
      .slice(0, 500);

    const journal = xmlText(entry, 'prism:publicationName');
    const id = ciniiUrl.split('/').pop() ?? title;

    results.push({
      id: `cinii-${id}`,
      title,
      authors: authors.slice(0, 5),
      year: isNaN(year as number) ? null : year,
      abstract,
      source: 'CiNii Research',
      sourceType: 'academic',
      pdfUrl: irUri,
      doi,
      url: ciniiUrl || irUri,
      journal: journal || undefined,
    });
  }

  return results;
}
