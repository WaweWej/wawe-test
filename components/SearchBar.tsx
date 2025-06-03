
import React from 'react';
import { SearchBarProps } from '../types';

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, query, onQueryChange }) => {
  // const [query, setQuery] = useState<string>(''); // Removed internal state

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8 md:mb-10">
      <input
        type="text"
        value={query} // Controlled by prop
        onChange={(e) => onQueryChange(e.target.value)} // Call prop on change
        placeholder="e.g., Business Model Canvas, SWOT Analysis..."
        className="flex-grow p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none placeholder-gray-400 text-gray-900 transition-colors duration-200"
        disabled={isLoading}
        aria-label="Template name input"
      />
      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          'Get Template'
        )}
      </button>
    </form>
  );
};
