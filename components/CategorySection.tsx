import React, { useState } from 'react';
import { CategorySectionProps } from '../types';

export const CategorySection: React.FC<CategorySectionProps> = ({ category, onModelClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleModelClick = (modelName: string) => {
    onModelClick(modelName);
  };

  return (
    <div className={`border border-gray-200 shadow-sm ${isOpen ? 'rounded-t-lg' : 'rounded-lg'}`}>
      <button
        onClick={handleToggle}
        className={`w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-300 transition-colors duration-150 ${isOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
        aria-expanded={isOpen}
        aria-controls={`category-models-${category.title.replace(/\s+/g, '-')}`}
      >
        <h3 className="text-lg font-medium text-sky-700">{category.title}</h3>
        <svg
          className={`w-6 h-6 text-sky-600 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div 
            id={`category-models-${category.title.replace(/\s+/g, '-')}`}
            className="p-4 bg-white border-t border-gray-200 rounded-b-lg" // Added rounded-b-lg
        >
          {category.models.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {category.models.map((model) => (
                <li key={model.name} className="relative group"> {/* Added relative and group */}
                  <button
                    onClick={() => handleModelClick(model.name)}
                    className="w-full text-left p-2 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 transition-colors duration-150"
                    aria-label={`Generate template for ${model.name}`}
                  >
                    {model.name}
                  </button>
                  {/* Tooltip for model explanation */}
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
          ) : (
            <p className="text-sm text-gray-500">No models listed in this category yet.</p>
          )}
        </div>
      )}
    </div>
  );
};