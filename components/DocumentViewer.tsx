import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Maximize2, Table, Layout, FileText, Presentation } from 'lucide-react';

// Set worker source for pdfjs
// @ts-ignore
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  file: File;
  activeTarget: { type: string, value: string | number } | null;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ file, activeTarget }) => {
  const [fileType, setFileType] = useState<string>('');
  const [content, setContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setFileType(ext);
    
    const loadContent = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        if (ext === 'pdf') {
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          setContent({ pdf, numPages: pdf.numPages });
        } else if (ext === 'docx') {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setContent({ html: result.value });
        } else if (ext === 'xlsx' || ext === 'xls') {
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheets: Record<string, any[][]> = {};
          workbook.SheetNames.forEach(name => {
            sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
          });
          setContent({ sheets, sheetNames: workbook.SheetNames });
        } else if (ext === 'pptx') {
          // PPTX logic is handled via custom text extraction in documentParser
          // but here we can render a simple view
          const text = await file.text(); // fallback or custom logic
          setContent({ raw: text });
        }
      } catch (err) {
        console.error('Error loading document:', err);
        setError('Failed to load document preview.');
      }
    };

    loadContent();
  }, [file]);

  useEffect(() => {
    if (activeTarget && containerRef.current) {
      const selector = `[data-target-type="${activeTarget.type}"][data-target-value="${activeTarget.value}"]`;
      const element = containerRef.current.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeTarget]);

  const renderHeader = () => {
    const Icon = fileType === 'pdf' ? FileText : (fileType === 'pptx' ? Presentation : (fileType.includes('xls') ? Table : Layout));
    return (
      <div className="p-4 border-b border-white/5 bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon size={16} className="text-primary" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-widest truncate max-w-[200px]">{file.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            {activeTarget ? `Navigating to ${activeTarget.type} ${activeTarget.value}` : 'Document Preview'}
          </span>
          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 text-xs">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col h-full bg-slate-900/50 rounded-3xl border border-white/10 overflow-hidden items-center justify-center p-12 text-center">
        <AlertCircle size={48} className="text-slate-600 mb-4" />
        <p className="text-slate-400 text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-3xl border border-white/10 overflow-hidden">
      {renderHeader()}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar">
        {fileType === 'pdf' && content?.pdf && (
          Array.from({ length: content.numPages }, (_, i) => i + 1).map((pageNumber) => (
            <PdfPageRenderer key={pageNumber} pdf={content.pdf} pageNumber={pageNumber} isActive={activeTarget?.type === 'page' && activeTarget.value === pageNumber} />
          ))
        )}
        {(fileType === 'xlsx' || fileType === 'xls') && content?.sheets && (
          content.sheetNames.map((name: string) => (
            <XlsxSheetRenderer key={name} name={name} data={content.sheets[name]} isActive={activeTarget?.type === 'sheet' && activeTarget.value === name} />
          ))
        )}
        {fileType === 'docx' && content?.html && (
           <DocxRenderer html={content.html} activeSection={activeTarget?.type === 'section' ? Number(activeTarget.value) : null} />
        )}
        {fileType === 'pptx' && (
           <PptxPlaceholder file={file} activeSlide={activeTarget?.type === 'slide' ? Number(activeTarget.value) : null} />
        )}
      </div>
    </div>
  );
};

const PdfPageRenderer: React.FC<{ pdf: any; pageNumber: number; isActive: boolean }> = ({ pdf, pageNumber, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const render = async () => {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    };
    render();
  }, [pdf, pageNumber]);

  return (
    <div data-target-type="page" data-target-value={pageNumber} className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-500 ${isActive ? 'ring-4 ring-primary ring-offset-4 ring-offset-slate-900 scale-[1.02]' : ''}`}>
      <canvas ref={canvasRef} className="w-full h-auto" />
    </div>
  );
};

const XlsxSheetRenderer: React.FC<{ name: string; data: any[][]; isActive: boolean }> = ({ name, data, isActive }) => (
  <div data-target-type="sheet" data-target-value={name} className={`bg-slate-800/50 rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 ${isActive ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
    <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
      <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
        <Table size={14} className="text-primary" /> SHEET: {name}
      </h4>
    </div>
    <div className="overflow-x-auto p-4">
      <table className="w-full text-left text-[10px] text-slate-400">
        <tbody>
          {data.slice(0, 100).map((row, ri) => (
            <tr key={ri} className="border-b border-white/5 hover:bg-white/5">
              {row.map((cell, ci) => <td key={ci} className="px-3 py-2 border-r border-white/5 whitespace-nowrap">{String(cell || '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DocxRenderer: React.FC<{ html: string; activeSection: number | null }> = ({ html, activeSection }) => {
  // We simulate sections by splitting the HTML into paragraph clones for navigation
  const paragraphs = html.split('</p>').map(p => p + '</p>').filter(p => p.trim());
  return (
    <div className="bg-white rounded-2xl p-12 text-slate-800 prose prose-slate max-w-none">
      {paragraphs.map((p, i) => (
        <div 
          key={i} 
          data-target-type="section" 
          data-target-value={i + 1}
          className={`transition-all duration-500 rounded-lg p-2 ${activeSection === i + 1 ? 'bg-primary/10 ring-2 ring-primary' : ''}`}
          dangerouslySetInnerHTML={{ __html: p }} 
        />
      ))}
    </div>
  );
};

const PptxPlaceholder: React.FC<{ file: File; activeSlide: number | null }> = ({ file, activeSlide }) => {
  const [slides, setSlides] = useState<string[]>([]);
  useEffect(() => {
    // Re-extract slides for preview
    const extract = async () => {
       const { extractTextFromPPTX } = await import('../utils/documentParser');
       const text = await extractTextFromPPTX(file);
       const slidesText = text.split(/\[SLIDE: \d+\]/).filter(s => s.trim());
       setSlides(slidesText);
    };
    extract();
  }, [file]);

  return (
    <div className="space-y-6">
      {slides.map((slide, i) => (
        <div key={i} data-target-type="slide" data-target-value={i + 1} className={`bg-slate-800 rounded-2xl border border-white/10 p-8 min-h-[300px] flex flex-col transition-all duration-500 ${activeSlide === i + 1 ? 'ring-4 ring-primary scale-[1.02] bg-primary/5' : ''}`}>
           <div className="flex justify-between items-start mb-6">
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">SLIDE {i+1}</span>
             <Presentation size={20} className="text-slate-600" />
           </div>
           <p className="text-sm text-slate-300 leading-relaxed italic">"{slide.trim()}"</p>
        </div>
      ))}
    </div>
  );
};
