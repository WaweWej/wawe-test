
import React from 'react';
import { ModelDiscoveryProps } from '../types';
import { CategorySection } from './CategorySection';

export const ModelDiscovery: React.FC<ModelDiscoveryProps> = ({ modelsData, onModelClick }) => {
  if (!modelsData || modelsData.length === 0) {
    return null;
  }

  return (
    <div className="my-8 md:my-10">
      <h2 className="text-2xl font-semibold text-gray-700 mb-3 text-center sm:text-left">Explore Templates</h2>
      <p className="text-gray-600 mb-6 text-center sm:text-left text-sm">
        Click a category to expand, then click a model name to generate its template.
      </p>
      <div className="space-y-4">
        {modelsData.map((category) => (
          <CategorySection 
            key={category.title} 
            category={category} 
            onModelClick={onModelClick} 
          />
        ))}
      </div>
    </div>
  );
};
