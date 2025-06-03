
export interface TemplateSection {
  id: string; // A unique slug-like identifier (e.g., 'key_partners', 'strengths')
  title: string; // The display title for the section (e.g., 'Key Partners', 'Strengths')
  description: string; // A brief explanation or key questions for this section
  placeholder: string; // Example text or a prompt for what to fill in
  // Stores user input for this section
  content?: string; 
}

export interface CorporateTemplate {
  title: string;
  sections: TemplateSection[];
}

export interface GeminiErrorResponse {
  error: string;
  details?: string;
}

// Union type for what Gemini service might return for template fetching
export type TemplateFetchResult = CorporateTemplate | GeminiErrorResponse;

export interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  query: string; 
  onQueryChange: (newQuery: string) => void; 
}

export interface TemplateDisplayProps {
  template: CorporateTemplate | null;
  onSectionContentChange: (sectionId: string, newContent: string) => void;
}

export interface ErrorMessageProps {
  message: string | null;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

// Types for Model Discovery
export interface DiscoveredModel {
  name: string; // Display name, also used as search query
  explanation: string; // Mandatory explanation for the dedicated template page.
}

export interface ModelCategory {
  title: string;
  models: DiscoveredModel[];
}

export interface ModelDiscoveryProps {
  modelsData: ModelCategory[];
  onModelClick: (modelName: string) => void;
}

export interface CategorySectionProps {
  category: ModelCategory;
  onModelClick: (modelName: string) => void;
}

// Types for Model Suggestions (used by ProblemDescriptionSearch)
export interface SuggestedModelNamesResponse {
  suggestedModelNames: string[];
}

export type ModelSuggestionFetchResult = SuggestedModelNamesResponse | GeminiErrorResponse;

// Removed RelatedModelSuggesterProps interface

// Types for Problem Description Search (Home View)
export interface ProblemDescriptionSearchProps {
    onProblemSubmit: (problemDescription: string) => void;
    suggestedModels: DiscoveredModel[];
    isLoading: boolean;
    error: string | null;
    onModelClick: (modelName: string) => void;
}
