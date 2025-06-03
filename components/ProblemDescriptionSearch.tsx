
import React, { useState } from 'react';
import { ProblemDescriptionSearchProps, DiscoveredModel } from '../types';

export const ProblemDescriptionSearch: React.FC<ProblemDescriptionSearchProps> = ({
  onProblemSubmit,
  suggestedModels,
  isLoading,
  error,
  onModelClick,
}) => {
  const [problemText, setProblemText] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!problemText.trim()) return;
    onProblemSubmit(problemText);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-3">Describe Your Challenge</h2>
      <p className="text-sm text-gray-600 mb-4">
        Not sure which model to use? Describe what you're trying to solve, and we'll suggest some relevant frameworks.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={problemText}
          onChange={(e) => setProblemText(e.target.value)}
          placeholder="e.g., 'We are losing market share to new competitors.' or 'How can our team improve collaboration on projects?'"
          rows={4}
          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none placeholder-gray-400 text-gray-900 resize-y"
          disabled={isLoading}
          aria-label="Problem description for model suggestions"
        />
        <button
          type="submit"
          disabled={isLoading || !problemText.trim()}
          className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Finding Models...
            </>
          ) : (
            'Find Relevant Models'
          )}
        </button>
      </form>

      {isLoading && (
         <div className="flex justify-center items-center my-6">
            <svg className="animate-spin h-6 w-6 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
         </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          <p className="font-semibold">Could not get suggestions:</p>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && suggestedModels.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Suggested Models:</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestedModels.map((model) => (
              <li key={model.name} className="relative group">
                <button
                  onClick={() => onModelClick(model.name)}
                  className="w-full text-left p-3 bg-sky-50 hover:bg-sky-100 text-gray-800 hover:text-sky-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-150 shadow-sm hover:shadow-md"
                  aria-label={`Generate template for ${model.name}`}
                >
                  {model.name}
                </button>
                 <div 
                    className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-2 w-72 max-w-xs p-3 
                               bg-gray-800 text-white text-xs rounded-md shadow-xl 
                               invisible opacity-0 group-hover:visible group-hover:opacity-100 
                               transition-all duration-200 ease-in-out pointer-events-none
                               transform group-hover:translate-y-0 translate-y-1"
                    role="tooltip"
                  >
                    <p className="font-semibold text-sky-300 mb-1">{model.name}</p>
                    <p className="text-gray-200 leading-relaxed">{model.explanation}</p>
                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-gray-800"></div>
                  </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!isLoading && !error && problemText && suggestedModels.length === 0 && (
         <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-md text-sm">
            <p>No specific models found for your description, or the AI couldn't provide suggestions. Try rephrasing or explore categories below.</p>
        </div>
      )}
    </div>
  );
};
