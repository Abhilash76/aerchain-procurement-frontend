import JSZip from 'jszip';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Set worker source for pdfjs using a CDN to avoid bundling issues
// @ts-ignore
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

export const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // @ts-ignore
    const strings = content.items.map((item: any) => item.str);
    text += `[PAGE: ${i}]\n` + strings.join(' ') + '\n';
  }
  return text;
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  // Split by double newlines and add section markers
  const paragraphs = result.value.split('\n\n').filter(p => p.trim());
  return paragraphs.map((p, i) => `[SECTION: ${i + 1}]\n${p}`).join('\n\n');
};

export const extractTextFromExcel = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let text = '';
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    text += `\n[SHEET: ${sheetName}]\n`;
    // @ts-ignore
    text += XLSX.utils.sheet_to_txt(worksheet) + '\n';
  });
  return text;
};

export const extractTextFromPPTX = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  let text = '';

  // Find all slide XML files
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
  // Sort them numerically
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
    const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
    return numA - numB;
  });

  for (let i = 0; i < slideFiles.length; i++) {
    const slideXml = await zip.file(slideFiles[i])?.async('text');
    if (slideXml) {
      // Very basic extraction of text in <a:t> tags
      const textMatches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g);
      const slideText = textMatches ? textMatches.map(m => m.replace(/<\/?a:t>/g, '')).join(' ') : '';
      text += `\n[SLIDE: ${i + 1}]\n${slideText}\n`;
    }
  }
  return text;
};

export const extractContent = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop()?.toLowerCase();

  try {
    switch (ext) {
      case 'pdf':
        return await extractTextFromPDF(file);
      case 'docx':
        return await extractTextFromDocx(file);
      case 'xlsx':
      case 'xls':
        return await extractTextFromExcel(file);
      case 'pptx':
        return await extractTextFromPPTX(file);
      case 'txt':
      case 'md':
      case 'json':
      case 'csv':
        return await file.text();
      default:
        return await file.text();
    }
  } catch (error) {
    console.error(`Error parsing ${ext} file:`, error);
    throw new Error(`Failed to parse ${file.name}.`);
  }
};
