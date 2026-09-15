export interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  source: string;
  sourceType: 'academic' | 'preprint';
  pdfUrl: string;
  doi?: string;
  url: string;
  journal?: string;
  citations?: number;
}

export type SourceId = 'openalex' | 'arxiv' | 'semanticscholar' | 'pubmed' | 'cinii';

export interface SearchSource {
  id: SourceId;
  name: string;
  description: string;
  badge?: string;
}

export const AVAILABLE_SOURCES: SearchSource[] = [
  { id: 'openalex', name: 'OpenAlex', description: '世界最大のOA学術データベース（日本語クエリで自動絞込）' },
  { id: 'arxiv', name: 'arXiv', description: '理工系・数学・CSのプレプリント', badge: 'プレプリント' },
  { id: 'semanticscholar', name: 'Semantic Scholar', description: 'AI・CS分野に強い学術検索' },
  { id: 'pubmed', name: 'PubMed Central', description: '医学・生命科学のOA論文' },
  { id: 'cinii', name: 'CiNii Research', description: '日本の機関リポジトリ（IR）OA論文', badge: '日本語' },
];
