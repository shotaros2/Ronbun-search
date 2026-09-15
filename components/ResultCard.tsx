import { SearchResult } from '@/lib/types';

interface Props {
  result: SearchResult;
}

const SOURCE_BADGE: Record<string, string> = {
  OpenAlex: 'bg-violet-50 text-violet-600 border border-violet-100',
  arXiv: 'bg-red-50 text-red-600 border border-red-100',
  'Semantic Scholar': 'bg-blue-50 text-blue-600 border border-blue-100',
  'PubMed Central': 'bg-green-50 text-green-600 border border-green-100',
  'CiNii Research': 'bg-orange-50 text-orange-600 border border-orange-100',
};

export function ResultCard({ result }: Props) {
  const badgeClass = SOURCE_BADGE[result.source] ?? 'bg-gray-50 text-gray-600 border border-gray-100';

  return (
    <article className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${badgeClass}`}>
              {result.source}
            </span>
            {result.sourceType === 'preprint' && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-yellow-50 text-yellow-600 border border-yellow-100">
                プレプリント
              </span>
            )}
            {result.year && (
              <span className="text-xs text-gray-400">{result.year}</span>
            )}
            {!!result.citations && result.citations > 0 && (
              <span className="text-xs text-gray-400">
                引用 {result.citations.toLocaleString()}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 leading-snug mb-1">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              {result.title}
            </a>
          </h3>

          {/* Authors */}
          {result.authors.length > 0 && (
            <p className="text-sm text-gray-500 mb-1">
              {result.authors.join(', ')}
              {result.authors.length >= 5 && ' ほか'}
            </p>
          )}

          {/* Journal */}
          {result.journal && (
            <p className="text-sm text-gray-400 italic mb-2">{result.journal}</p>
          )}

          {/* Abstract */}
          {result.abstract && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {result.abstract}
            </p>
          )}

          {/* DOI */}
          {result.doi && (
            <p className="text-xs text-gray-300 mt-2 font-mono">DOI: {result.doi}</p>
          )}
        </div>

        {/* PDF button */}
        <a
          href={result.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
          aria-label={`${result.title} のPDFをダウンロード`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF
        </a>
      </div>
    </article>
  );
}
