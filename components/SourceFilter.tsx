'use client';

import { AVAILABLE_SOURCES, SourceId } from '@/lib/types';

interface Props {
  selected: SourceId[];
  onChange: (s: SourceId[]) => void;
  disabled?: boolean;
}

const SOURCE_COLORS: Record<SourceId, string> = {
  openalex: 'bg-violet-100 text-violet-700 border-violet-200',
  arxiv: 'bg-red-100 text-red-700 border-red-200',
  semanticscholar: 'bg-blue-100 text-blue-700 border-blue-200',
  pubmed: 'bg-green-100 text-green-700 border-green-200',
  cinii: 'bg-orange-100 text-orange-700 border-orange-200',
};

export function SourceFilter({ selected, onChange, disabled }: Props) {
  const toggle = (id: SourceId) => {
    if (selected.includes(id)) {
      if (selected.length > 1) onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const allSelected = selected.length === AVAILABLE_SOURCES.length;
  const toggleAll = () =>
    onChange(allSelected ? [AVAILABLE_SOURCES[0].id] : AVAILABLE_SOURCES.map(s => s.id));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-400 font-medium">検索対象:</span>
      <button
        onClick={toggleAll}
        disabled={disabled}
        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-40 ${
          allSelected
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
        }`}
      >
        すべて
      </button>
      {AVAILABLE_SOURCES.map(src => {
        const on = selected.includes(src.id);
        return (
          <button
            key={src.id}
            onClick={() => toggle(src.id)}
            disabled={disabled}
            title={src.description}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-40 ${
              on
                ? SOURCE_COLORS[src.id]
                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
            }`}
          >
            {src.name}
            {src.badge && <span className="ml-1 opacity-60">({src.badge})</span>}
          </button>
        );
      })}
    </div>
  );
}
