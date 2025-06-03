
import React, { useState, useRef, useEffect } from 'react';
import { TemplateDisplayProps, TemplateSection } from '../types';

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const SectionCard: React.FC<{ section: TemplateSection; onContentChange: (id: string, content: string) => void }> = ({ section, onContentChange }) => {
  return (
    <div className="bg-white p-5 md:p-6 rounded-lg shadow-lg border border-gray-200 break-inside-avoid transition-all duration-300 hover:shadow-sky-500/20">
      <h3 className="text-xl font-semibold text-sky-600 mb-2">{section.title}</h3>
      <p className="text-sm text-gray-600 mb-4">{section.description}</p>
      <textarea
        value={section.content || ''}
        onChange={(e) => onContentChange(section.id, e.target.value)}
        placeholder={section.placeholder}
        rows={5}
        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none placeholder-gray-400 text-gray-900 resize-y transition-colors duration-200"
        aria-label={`Content for ${section.title}`}
      />
    </div>
  );
};


export const TemplateDisplay: React.FC<TemplateDisplayProps> = ({ template, onSectionContentChange }) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const templateCaptureRef = useRef<HTMLDivElement>(null);
  const [libsStatus, setLibsStatus] = useState<{ ready: boolean, error: string | null, loading: boolean }>({ ready: false, error: null, loading: true });

  useEffect(() => {
    if (libsStatus.ready || libsStatus.error) {
        if (libsStatus.loading) {
             setLibsStatus(s => ({ ...s, loading: false }));
        }
        return;
    }

    let intervalId: number | undefined = undefined;
    let timeoutId: number | undefined = undefined;

    const checkAndSetStatus = () => {
        if (window.html2canvas && typeof window.html2canvas === 'function' &&
            window.jspdf && typeof window.jspdf.jsPDF === 'function') {
            setLibsStatus({ ready: true, error: null, loading: false });
            if (intervalId) window.clearInterval(intervalId);
            if (timeoutId) window.clearTimeout(timeoutId);
            return true;
        }
        return false;
    };

    if (checkAndSetStatus()) {
        return; 
    }

    setLibsStatus(s => ({ ...s, loading: true, error: null })); 
    intervalId = window.setInterval(checkAndSetStatus, 500);

    timeoutId = window.setTimeout(() => {
        if (intervalId) window.clearInterval(intervalId);
        if (!checkAndSetStatus()) { 
             console.warn("PDF libraries failed to load after 10 seconds timeout.");
             setLibsStatus({
                 ready: false,
                 error: "PDF tools couldn't load. This might be due to network issues, ad-blockers, or browser extensions. Please refresh. Ensure scripts from cdnjs.cloudflare.com are allowed.",
                 loading: false
             });
        }
    }, 10000); 

    return () => { 
        if (intervalId) window.clearInterval(intervalId);
        if (timeoutId) window.clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  if (!template) {
    return null;
  }

  const handleDownloadPdf = async () => {
    if (!libsStatus.ready) {
      console.error("Attempted to download PDF, but libraries are not ready.", libsStatus.error);
      alert(libsStatus.error || "PDF generation tools are not ready. Please wait or refresh the page.");
      return;
    }

    if (!templateCaptureRef.current) {
        console.error("Template capture area not available for PDF generation.");
        alert("Cannot generate PDF: template capture area is missing.");
        return;
    }
    
    setIsDownloadingPdf(true);
    try {
      const canvas = await window.html2canvas(templateCaptureRef.current, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Ensure canvas background is white for PDF
         onclone: (documentClone) => {
            const captureArea = documentClone.getElementById('template-capture-area-inner');
            if (captureArea) {
              // Ensure the title and section cards within the cloned document use appropriate styling for capture
              // For simplicity, we rely on them inheriting styles or having them directly applied.
              // Ensure background of the cloned capture area is white.
               captureArea.style.backgroundColor = '#ffffff';
            }

            const textareas = documentClone.querySelectorAll('textarea');
            textareas.forEach(textarea => {
                const div = documentClone.createElement('div');
                const computedStyle = getComputedStyle(textarea);
                div.style.width = computedStyle.width;
                div.style.height = 'auto'; 
                div.style.minHeight = computedStyle.minHeight || computedStyle.height;
                div.style.padding = computedStyle.padding;
                div.style.margin = computedStyle.margin;
                div.style.border = computedStyle.border;
                div.style.fontFamily = computedStyle.fontFamily;
                div.style.fontSize = computedStyle.fontSize;
                div.style.lineHeight = computedStyle.lineHeight;
                div.style.whiteSpace = 'pre-wrap'; 
                div.style.wordWrap = 'break-word'; 
                div.style.color = computedStyle.color || '#374151'; // Default to dark gray if not set
                div.style.backgroundColor = computedStyle.backgroundColor || '#f9fafb'; // Default to light gray
                div.style.boxSizing = computedStyle.boxSizing;
                div.style.borderRadius = computedStyle.borderRadius;

                div.textContent = textarea.value;
                textarea.parentNode?.replaceChild(div, textarea);
            });
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = 210; 
      const pdfHeight = 297;
      const margin = 10; 

      const { jsPDF } = window.jspdf; 
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16 
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const aspectRatio = imgProps.width / imgProps.height;
      
      let newImgWidth = pdfWidth - (2 * margin);
      let newImgHeight = newImgWidth / aspectRatio;

      if (newImgHeight > pdfHeight - (2 * margin)) {
          newImgHeight = pdfHeight - (2 * margin);
          newImgWidth = newImgHeight * aspectRatio;
      }
      
      const xOffset = (pdfWidth - newImgWidth) / 2;
      const yOffset = margin;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, newImgWidth, newImgHeight);
      
      const fileName = `${template.title.replace(/\s+/g, '_') || 'corporate_template'}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Error generating PDF: ${error instanceof Error ? error.message : String(error)}. Check the console for more details.`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };
  
  let pdfButtonText = 'Download as PDF';
  if (libsStatus.loading) {
    pdfButtonText = 'Loading PDF Tools...';
  }
  if (isDownloadingPdf) {
    pdfButtonText = 'Downloading PDF...';
  }

  return (
    <div className="mt-6 animate-fadeInSmooth">
      {/* This outer div with ref is for html2canvas to capture. Its background is set to white for the PDF. */}
      <div ref={templateCaptureRef} id="template-capture-area" className="bg-white"> 
        {/* This inner div is for visual styling on the page and contains the actual content. */}
        <div id="template-capture-area-inner" className="p-4 md:p-6 bg-white"> {/* Ensure this also has white bg or is transparent */}
            <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
            {template.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"> {/* Adjusted lg:grid-cols-3 to md:grid-cols-2 for better fit */}
            {template.sections.map((section) => (
                <SectionCard key={section.id} section={section} onContentChange={onSectionContentChange} />
            ))}
            </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf || !libsStatus.ready || libsStatus.loading}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center mx-auto"
          aria-label="Download template as PDF"
          aria-live="polite"
        >
          {(isDownloadingPdf || libsStatus.loading) && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {pdfButtonText}
        </button>
        {libsStatus.error && (
          <p className="text-red-700 text-sm mt-3 p-3 bg-red-100 border border-red-300 rounded-md" role="alert">
            {libsStatus.error}
          </p>
        )}
      </div>
    </div>
  );
};
