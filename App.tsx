
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SearchBar } from './components/SearchBar';
import { TemplateDisplay } from './components/TemplateDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { ModelDiscovery } from './components/ModelDiscovery';
// Removed import for RelatedModelSuggester
import { ProblemDescriptionSearch } from './components/ProblemDescriptionSearch'; 
import { fetchTemplateFromGemini, fetchModelsByProblemDescription } from './services/geminiService'; // Removed fetchRelatedModelSuggestions
import { CorporateTemplate, TemplateFetchResult, GeminiErrorResponse, DiscoveredModel, ModelSuggestionFetchResult } from './types';
import { categorizedModelsData } from './data/categorizedModels';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false); // For template generation
  const [error, setError] = useState<string | null>(null); // For template generation
  const [currentTemplate, setCurrentTemplate] = useState<CorporateTemplate | null>(null);
  const [query, setQuery] = useState<string>(''); // For direct model name search
  const [currentModelNameFromRoute, setCurrentModelNameFromRoute] = useState<string | null>(null);

  // Removed State for Related Model Suggester (Template View)
  // const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  // const [relatedModelSuggestionsList, setRelatedModelSuggestionsList] = useState<DiscoveredModel[]>([]);
  // const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // State for Problem Description Search (Home View) - Stays
  const [isLoadingProblemModels, setIsLoadingProblemModels] = useState<boolean>(false);
  const [problemBasedModelSuggestions, setProblemBasedModelSuggestions] = useState<DiscoveredModel[]>([]);
  const [problemBasedSearchError, setProblemBasedSearchError] = useState<string | null>(null);


  const flattenedModels = useMemo((): DiscoveredModel[] => {
    return categorizedModelsData.reduce((acc, category) => acc.concat(category.models), [] as DiscoveredModel[]);
  }, []);

  const findModelData = useCallback((modelName: string): DiscoveredModel | undefined => {
    return flattenedModels.find(m => m.name.toLowerCase() === modelName.toLowerCase());
  }, [flattenedModels]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/template/')) {
        const modelName = decodeURIComponent(hash.substring('#/template/'.length));
        setCurrentModelNameFromRoute(modelName);
        // Removed state clearing for related suggestions
        // setRelatedModelSuggestionsList([]); 
        // setSuggestionError(null);
        if(document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setCurrentModelNameFromRoute(null);
        setProblemBasedModelSuggestions([]);
        setProblemBasedSearchError(null);
        if (hash === '#/' || hash === '') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); 

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSearch = useCallback(async (searchQuery: string, navigateToTemplateView: boolean = true) => {
    if (!searchQuery.trim()) {
      setError("Please enter a template name.");
      setCurrentTemplate(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      const result: TemplateFetchResult = await fetchTemplateFromGemini(searchQuery);
      
      if ('error' in result) {
        const errorResult = result as GeminiErrorResponse;
        setError(`Failed to generate template for "${searchQuery}": ${errorResult.error}${errorResult.details ? ` (${errorResult.details})` : ''}`);
        setCurrentTemplate(null);
      } else {
        const templateWithContent = result as CorporateTemplate;
        templateWithContent.sections = templateWithContent.sections.map(section => ({
          ...section,
          content: '' 
        }));
        setCurrentTemplate(templateWithContent);
        if (navigateToTemplateView) {
          window.location.hash = `#/template/${encodeURIComponent(templateWithContent.title)}`;
        }
      }
    } catch (e: any) {
      console.error("Error fetching template:", e);
      setError(e.message || "An unexpected error occurred. Check console for details.");
      setCurrentTemplate(null);
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (currentModelNameFromRoute) {
      if (!currentTemplate || currentTemplate.title.toLowerCase() !== currentModelNameFromRoute.toLowerCase()) {
        setQuery(currentModelNameFromRoute); 
        handleSearch(currentModelNameFromRoute, false);
      }
    } else {
      setCurrentTemplate(null);
      setError(null);
    }
  }, [currentModelNameFromRoute, handleSearch, currentTemplate]);

  const handleSectionContentChange = useCallback((sectionId: string, newContent: string) => {
    setCurrentTemplate(prevTemplate => {
      if (!prevTemplate) return null;
      return {
        ...prevTemplate,
        sections: prevTemplate.sections.map(section =>
          section.id === sectionId ? { ...section, content: newContent } : section
        ),
      };
    });
  }, []);

  const handleDiscoveredModelClick = useCallback((modelName: string) => {
    setQuery(modelName); 
    window.location.hash = `#/template/${encodeURIComponent(modelName)}`;
  }, []);

  const navigateToHomeView = () => {
    window.location.hash = '#/';
  };

  // Removed handleFetchRelatedSuggestions function

  const handleProblemBasedSearchSubmit = useCallback(async (problemDescription: string) => {
    setIsLoadingProblemModels(true);
    setProblemBasedSearchError(null);
    setProblemBasedModelSuggestions([]);
    setError(null); 

    try {
      const result: ModelSuggestionFetchResult = await fetchModelsByProblemDescription(problemDescription);
      if ('error' in result) {
        setProblemBasedSearchError(`Failed to get suggestions: ${result.error}${result.details ? ` (${result.details})` : ''}`);
      } else {
        const validSuggestions = result.suggestedModelNames
          .map(name => findModelData(name))
          .filter(model => model !== undefined) as DiscoveredModel[];
        setProblemBasedModelSuggestions(validSuggestions);
        if (validSuggestions.length === 0 && result.suggestedModelNames.length > 0) {
          setProblemBasedSearchError("AI suggested models not in our current library, or no relevant suggestions found.");
        }
      }
    } catch (e: any) {
      console.error("Error fetching problem-based suggestions:", e);
      setProblemBasedSearchError(e.message || "An unexpected error occurred while fetching suggestions for your problem.");
    } finally {
      setIsLoadingProblemModels(false);
    }
  }, [findModelData]);


  if (currentModelNameFromRoute) { // TEMPLATE VIEW
    const modelDetails = findModelData(currentModelNameFromRoute);
    return (
      <div className="min-h-screen bg-gray-100 text-gray-800 p-4 sm:p-6 md:p-8 flex flex-col items-center">
        <header className="w-full max-w-4xl mb-6 text-left">
          <button
            onClick={navigateToHomeView}
            className="mb-6 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-md transition-colors duration-200 inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </button>
          {modelDetails && (
            <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 mb-3">
                {modelDetails.name}
              </h1>
              <p className="text-gray-700 text-base md:text-lg">{modelDetails.explanation}</p>
            </div>
          )}
        </header>

        {/* Removed RelatedModelSuggester section from here */}

        <main className="w-full max-w-3xl bg-white shadow-xl rounded-lg p-6 md:p-10">
          {error && <ErrorMessage message={error} />}
          {isLoading && !currentTemplate && ( 
            <div className="flex justify-center items-center my-12">
              <LoadingSpinner size="lg" />
              <p className="ml-4 text-xl text-gray-700">Loading {currentModelNameFromRoute}...</p>
            </div>
          )}
          {currentTemplate && currentTemplate.title.toLowerCase() === currentModelNameFromRoute.toLowerCase() && (
            <TemplateDisplay template={currentTemplate} onSectionContentChange={handleSectionContentChange} />
          )}
           {!isLoading && !error && !currentTemplate && modelDetails && (
             <div className="text-center py-12 text-gray-500">
                <p className="text-xl">Could not load template details for {currentModelNameFromRoute}.</p>
             </div>
           )}
            {!isLoading && !modelDetails && ( 
                <div className="text-center py-12 text-gray-500">
                    <p className="text-xl">Model "{currentModelNameFromRoute}" not found in our library.</p>
                </div>
            )}
        </main>
        <footer className="w-full max-w-4xl mt-16 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} AI Template Solutions. Powered by Gemini.</p>
        </footer>
      </div>
    );
  }

  // HOME VIEW
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl mb-10 md:mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
          Corporate Template Generator
        </h1>
        <p className="text-gray-600 mt-3 text-lg">
          Instantly generate business frameworks. Search directly, describe your problem, or explore categories below.
        </p>
      </header>

      <main className="w-full max-w-3xl bg-white shadow-xl rounded-lg p-6 md:p-10">
        <div className="mb-8 border-b border-gray-200 pb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Search by model name</h2>
            <SearchBar 
                onSearch={(sq) => handleSearch(sq, true)} 
                isLoading={isLoading} 
                query={query} 
                onQueryChange={setQuery} 
            />
        </div>
        
        <div className="mb-8 border-b border-gray-200 pb-8">
            <ProblemDescriptionSearch
                onProblemSubmit={handleProblemBasedSearchSubmit}
                suggestedModels={problemBasedModelSuggestions}
                isLoading={isLoadingProblemModels}
                error={problemBasedSearchError}
                onModelClick={handleDiscoveredModelClick}
            />
        </div>
        
        <ModelDiscovery 
            modelsData={categorizedModelsData} 
            onModelClick={handleDiscoveredModelClick} 
        />

        {error && !isLoading && !currentModelNameFromRoute && (
            <div className="mt-6">
                <ErrorMessage message={error} />
            </div>
        )}
        
        {isLoading && !currentModelNameFromRoute && (
          <div className="flex justify-center items-center my-12">
            <LoadingSpinner size="lg" />
            <p className="ml-4 text-xl text-gray-700">Processing direct search...</p>
          </div>
        )}

        {!isLoading && !error && !currentModelNameFromRoute && problemBasedModelSuggestions.length === 0 && !problemBasedSearchError && ( 
          <div className="text-center py-12 text-gray-500 mt-6">
            <p className="text-xl">To get started, enter a model name, describe your challenge, or explore the categories below.</p>
            <p className="mt-2">For example: "SWOT Analysis", or describe a problem like "How to improve sales?".</p>
          </div>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-16 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Template Solutions. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
