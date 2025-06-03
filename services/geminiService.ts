
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { CorporateTemplate, TemplateFetchResult, GeminiErrorResponse, ModelSuggestionFetchResult, SuggestedModelNamesResponse } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); // Fallback to prevent crash if undefined

const constructSystemPromptForTemplate = (userRequest: string): string => {
  return `
You are an expert in business strategy and corporate frameworks.
The user has requested a template for: "${userRequest}".

Please provide a structured JSON representation of this template.
The JSON object MUST conform to the following TypeScript interface:
\`\`\`typescript
interface TemplateSection {
  id: string; // A unique slug-like identifier (e.g., 'key_partners', 'strengths')
  title: string; // The display title for the section (e.g., 'Key Partners', 'Strengths')
  description: string; // A brief explanation or key questions for this section
  placeholder: string; // Example text or a prompt for what to fill in
}

interface CorporateTemplate {
  title: string; // The main title of the template (e.g., 'Business Model Canvas', 'SWOT Analysis')
  sections: TemplateSection[];
}
\`\`\`

Your response MUST be ONLY the JSON object described above. Do not include any other text, explanations, or markdown formatting like \`\`\`json ... \`\`\` around the JSON.

YOUR RESPONSE WILL BE PARSED STRICTLY AS JSON because 'responseMimeType' is 'application/json'.
ABSOLUTELY CRITICAL: All string values within your JSON output, particularly in 'description' and 'placeholder' fields, MUST be correctly escaped.
  - Unescaped double quotes (\") within a string value will break the JSON. Escape them as \\".
  - Unescaped newlines within a string value will break the JSON. Escape them as \\n.
  - Unescaped backslashes (\\) within a string value will break the JSON. Escape them as \\\\.
  - Ensure all other special characters (like tabs \\t, carriage returns \\r, form feeds \\f, etc.) are also correctly escaped.
If the JSON is not perfectly valid, the entire response will fail. Double-check your output before finalizing it.
Example of a correctly escaped string in JSON: { "example_field": "This is a string with \\"quotes\\", a newline\\nhere, and a backslash\\\\." }

If the requested template ("${userRequest}") is not a recognized or standard business framework, or if it's too ambiguous, respond with a JSON object of the following format:
\`\`\`json
{
  "error": "Template Not Recognized",
  "details": "The request '${userRequest}' does not correspond to a known business template or is too ambiguous."
}
\`\`\`
Ensure 'error' and 'details' fields are strings.

Example for 'SWOT Analysis':
{
  "title": "SWOT Analysis",
  "sections": [
    { "id": "strengths", "title": "Strengths", "description": "Internal positive attributes.", "placeholder": "e.g., Strong brand" },
    { "id": "weaknesses", "title": "Weaknesses", "description": "Internal negative attributes.", "placeholder": "e.g., High debt" },
    { "id": "opportunities", "title": "Opportunities", "description": "External factors to capitalize on.", "placeholder": "e.g., New markets" },
    { "id": "threats", "title": "Threats", "description": "External factors that could jeopardize.", "placeholder": "e.g., New competitors" }
  ]
}

Example for 'Business Model Canvas':
{
  "title": "Business Model Canvas",
  "sections": [
    { "id": "key_partners", "title": "Key Partners", "description": "Key partners and suppliers.", "placeholder": "e.g., Strategic alliances" },
    { "id": "key_activities", "title": "Key Activities", "description": "Key activities for value propositions.", "placeholder": "e.g., Production" },
    { "id": "key_resources", "title": "Key Resources", "description": "Key resources needed.", "placeholder": "e.g., Physical assets" },
    { "id": "value_propositions", "title": "Value Propositions", "description": "Value delivered to customers.", "placeholder": "e.g., Newness, Performance" },
    { "id": "customer_relationships", "title": "Customer Relationships", "description": "Types of customer relationships.", "placeholder": "e.g., Personal assistance" },
    { "id": "channels", "title": "Channels", "description": "How customer segments are reached.", "placeholder": "e.g., Web sales" },
    { "id": "customer_segments", "title": "Customer Segments", "description": "For whom value is created.", "placeholder": "e.g., Mass market" },
    { "id": "cost_structure", "title": "Cost Structure", "description": "Important costs in the model.", "placeholder": "e.g., Fixed costs" },
    { "id": "revenue_streams", "title": "Revenue Streams", "description": "How revenue is generated.", "placeholder": "e.g., Asset sale" }
  ]
}

Example for 'Engagement & Communication Value Ladder':
{
  "title": "Engagement & Communication Value Ladder",
  "sections": [
    { "id": "step1_buy", "title": "Step 1: Buy Product (Sender-Oriented)", "description": "Focus: Direct sales.", "placeholder": "e.g., Product benefits, CTA." },
    { "id": "step2_hear", "title": "Step 2: Hear Business (Sender-Oriented)", "description": "Focus: Company info.", "placeholder": "e.g., 'About Us', story." },
    { "id": "step3_passion", "title": "Step 3: Our Passion (Sender-Oriented)", "description": "Focus: Core 'why'.", "placeholder": "e.g., Blog on industry passion." },
    { "id": "step4_help_you", "title": "Step 4: Your Passion (Network-Oriented)", "description": "Focus: Customer needs.", "placeholder": "e.g., Interactive content, Q&A." },
    { "id": "step5_change_world", "title": "Step 5: Together Change (Network-Oriented)", "description": "Focus: Shared purpose.", "placeholder": "e.g., Co-creation, social impact." }
  ]
}

Provide the JSON response for "${userRequest}".
`;
};


export const fetchTemplateFromGemini = async (userPrompt: string): Promise<TemplateFetchResult> => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    return { 
      error: "API Key Error",
      details: "Gemini API key is not configured. Please set the API_KEY environment variable."
    };
  }

  const fullPrompt = constructSystemPromptForTemplate(userPrompt);
  let geminiResponse: GenerateContentResponse | null = null; 

  try {
    geminiResponse = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash-preview-04-17',
      contents: fullPrompt, 
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    
    let jsonStr = geminiResponse.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim(); 
    }

    const parsedJson = JSON.parse(jsonStr);

    if (parsedJson.error) {
      return parsedJson as GeminiErrorResponse;
    }
    
    if (parsedJson.title && Array.isArray(parsedJson.sections)) {
        const isValidSections = parsedJson.sections.every((s: any) => 
            typeof s.id === 'string' &&
            typeof s.title === 'string' &&
            typeof s.description === 'string' &&
            typeof s.placeholder === 'string'
        );
        if (isValidSections) {
            return parsedJson as CorporateTemplate;
        }
    }
    
    console.error("Unexpected JSON structure from Gemini for template generation:", parsedJson);
    return { 
        error: "Invalid Response Structure", 
        details: "The AI returned data for template generation in an unexpected format." 
    };

  } catch (error: any) {
    console.error("Error calling Gemini API or parsing response for template generation:", error);
    let errorMessage = "Failed to communicate with AI service for template generation.";
    if (error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
     if (error.toString().includes("API key not valid")) {
        return { 
            error: "API Key Invalid",
            details: "The provided Gemini API key is not valid. Please check your API_KEY environment variable."
        };
    }
    if (error instanceof SyntaxError) { 
        const rawResponseText = geminiResponse?.text || 'N/A (response not available after attempting to parse)';
        let errorPosition = -1;
        const matchPosition = error.message.match(/position (\d+)/);
        if (matchPosition && matchPosition[1]) {
            errorPosition = parseInt(matchPosition[1], 10);
        }
        const snippetLength = 100; 
        let contextSnippet = rawResponseText;
        if (errorPosition !== -1 && rawResponseText !== 'N/A (response not available after attempting to parse)') {
            const start = Math.max(0, errorPosition - snippetLength);
            const end = Math.min(rawResponseText.length, errorPosition + snippetLength);
            contextSnippet = `...${rawResponseText.substring(start, end)}...`;
        } else if (rawResponseText !== 'N/A (response not available after attempting to parse)') {
             contextSnippet = rawResponseText.substring(0, snippetLength * 2) + (rawResponseText.length > snippetLength * 2 ? "..." : "");
        }
        console.error(`SyntaxError during template generation at position ${errorPosition}. Snippet around error: [${contextSnippet}]`);
        return {
            error: "Invalid JSON Response",
            details: `The AI returned a malformed JSON for template generation. Error: ${error.message}`
        };
    }
    return { 
        error: "Service Error",
        details: errorMessage
    };
  }
};

// Removed constructSystemPromptForSuggestions function
// Removed fetchRelatedModelSuggestions function

const constructSystemPromptForProblemBasedSearch = (problemDescription: string): string => {
  return `
You are an expert business strategist and consultant.
A user has described a problem or area they are trying to investigate: "${problemDescription}".

Based SOLELY on this problem description, suggest 3 to 5 distinct and well-known business models or frameworks that would be most relevant for analyzing or solving this problem.
The suggestions should cover a range of analytical approaches if appropriate.

Your response MUST be ONLY a JSON object of the following format:
\`\`\`typescript
interface SuggestedModelNamesResponse {
  suggestedModelNames: string[]; // An array of 3 to 5 model names
}
\`\`\`

Example: If problemDescription is "Our startup is struggling to gain traction and we need to refine our core offering and identify our target customers.", a good response might be:
{
  "suggestedModelNames": ["Lean Canvas", "Value Proposition Canvas", "Customer Journey Map", "SWOT Analysis"]
}

ABSOLUTELY CRITICAL: Ensure all string values within the JSON array are simple strings. The JSON must be perfectly valid.
Do not include any other text, explanations, or markdown formatting like \`\`\`json ... \`\`\` around the JSON.
The response must be parseable by JSON.parse().
`;
};

export const fetchModelsByProblemDescription = async (problemDescription: string): Promise<ModelSuggestionFetchResult> => {
  if (!API_KEY || API_KEY === "MISSING_API_KEY") {
    return { 
      error: "API Key Error",
      details: "Gemini API key is not configured."
    };
  }

  const fullPrompt = constructSystemPromptForProblemBasedSearch(problemDescription);
  let geminiResponse: GenerateContentResponse | null = null;

  try {
    geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    let jsonStr = geminiResponse.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedJson = JSON.parse(jsonStr);

    if (parsedJson.error) {
        return parsedJson as GeminiErrorResponse;
    }

    if (Array.isArray(parsedJson.suggestedModelNames) && parsedJson.suggestedModelNames.every((name: any) => typeof name === 'string')) {
        return parsedJson as SuggestedModelNamesResponse;
    }
    
    console.error("Unexpected JSON structure from Gemini for problem-based suggestions:", parsedJson);
    return {
        error: "Invalid Problem-Based Suggestion Response Structure",
        details: "The AI returned problem-based suggestion data in an unexpected format."
    };

  } catch (error: any) {
    console.error("Error calling Gemini API or parsing response for problem-based suggestions:", error);
    let errorMessage = "Failed to get model suggestions based on problem from AI service.";
     if (error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
    if (error.toString().includes("API key not valid")) {
        return { 
            error: "API Key Invalid",
            details: "The provided Gemini API key is not valid."
        };
    }
    if (error instanceof SyntaxError) {
        const rawResponseText = geminiResponse?.text || 'N/A (response not available after attempting to parse)';
        let errorPosition = -1;
        const matchPosition = error.message.match(/position (\d+)/);
        if (matchPosition && matchPosition[1]) {
            errorPosition = parseInt(matchPosition[1], 10);
        }
        const snippetLength = 100;
        let contextSnippet = rawResponseText;
        if (errorPosition !== -1 && rawResponseText !== 'N/A (response not available after attempting to parse)') {
            const start = Math.max(0, errorPosition - snippetLength);
            const end = Math.min(rawResponseText.length, errorPosition + snippetLength);
            contextSnippet = `...${rawResponseText.substring(start, end)}...`;
        } else if (rawResponseText !== 'N/A (response not available after attempting to parse)') {
             contextSnippet = rawResponseText.substring(0, snippetLength * 2) + (rawResponseText.length > snippetLength * 2 ? "..." : "");
        }
        console.error(`SyntaxError during problem-based suggestions at position ${errorPosition}. Snippet around error: [${contextSnippet}]`);
        return {
            error: "Invalid JSON Response for Problem-Based Suggestions",
            details: `The AI returned a malformed JSON for problem-based suggestions. Error: ${error.message}`
        };
    }
    return {
        error: "Service Error",
        details: errorMessage
    };
  }
};
