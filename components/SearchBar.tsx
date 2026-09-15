'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
  defaultValue?: string;
}

export function SearchBar({ onSearch, loading, defaultValue = '' }: Props) {
  const [value, setValue] = useState(defaultValue);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="キーワード、著者名、タイトルを入力…"
        disabled={loading}
        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
      >
        {loading ? '検索中…' : '検索'}
      </button>
    </form>
  );
}
