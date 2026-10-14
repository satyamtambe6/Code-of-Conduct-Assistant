import { createRequire } from 'module';
import { IPolicyChunk, PolicyCategory } from '../types.ts';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfParse: any;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse load notice:', e);
}

export interface ParsedDocumentResult {
  fullText: string;
  chunks: Omit<IPolicyChunk, '_id' | 'policyId' | 'policyTitle' | 'category' | 'createdAt'>[];
}

export async function parseDocumentContent(
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<ParsedDocumentResult> {
  let fullText = '';

  if (mimetype === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
    try {
      const pdfData = await pdfParse(buffer);
      fullText = pdfData.text || '';
    } catch (err) {
      console.error('PDF parsing error:', err);
      throw new Error(`Failed to extract text from PDF document: ${(err as Error).message}`);
    }
  } else {
    // Plain text or markdown
    fullText = buffer.toString('utf-8');
  }

  // Clean up whitespace
  fullText = fullText.replace(/\r\n/g, '\n').trim();

  if (!fullText) {
    throw new Error('Extracted document content is empty.');
  }

  const chunks = chunkTextIntoSections(fullText);
  return { fullText, chunks };
}

export function chunkTextIntoSections(
  text: string
): Omit<IPolicyChunk, '_id' | 'policyId' | 'policyTitle' | 'category' | 'createdAt'>[] {
  const lines = text.split('\n');
  const chunks: Omit<IPolicyChunk, '_id' | 'policyId' | 'policyTitle' | 'category' | 'createdAt'>[] = [];

  let currentSectionTitle = 'General Overview';
  let currentChunkText = '';
  let chunkIndex = 0;
  let estimatedPage = 1;
  let lineCount = 0;

  const sectionHeaderRegex = /^(?:section|article|part|chapter|policy rule|clause|\d+\.|\d+\.\d+)\s+[:\w\s\-–—]+/i;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    lineCount++;

    if (lineCount % 45 === 0) {
      estimatedPage++;
    }

    // Check if line looks like a section header
    if (
      line.length > 3 &&
      line.length < 90 &&
      (sectionHeaderRegex.test(line) ||
        (line === line.toUpperCase() && line.length > 5 && !line.includes('.') && !line.includes(',')))
    ) {
      if (currentChunkText.trim().length > 150) {
        chunks.push({
          sectionTitle: currentSectionTitle,
          content: currentChunkText.trim(),
          chunkIndex: chunkIndex++,
          pageNumber: estimatedPage,
        });
        currentChunkText = '';
      }
      currentSectionTitle = line;
      continue;
    }

    currentChunkText += (currentChunkText ? '\n' : '') + line;

    // Split on size boundary (~650 characters)
    if (currentChunkText.length >= 700) {
      chunks.push({
        sectionTitle: currentSectionTitle,
        content: currentChunkText.trim(),
        chunkIndex: chunkIndex++,
        pageNumber: estimatedPage,
      });
      // Retain slight context overlap
      const sentences = currentChunkText.split(/(?<=[.?!])\s+/);
      currentChunkText = sentences.slice(-1).join(' ');
    }
  }

  if (currentChunkText.trim().length > 40) {
    chunks.push({
      sectionTitle: currentSectionTitle,
      content: currentChunkText.trim(),
      chunkIndex: chunkIndex++,
      pageNumber: estimatedPage,
    });
  }

  // Fallback if chunks array is empty
  if (chunks.length === 0) {
    chunks.push({
      sectionTitle: 'Complete Document',
      content: text.slice(0, 2000),
      chunkIndex: 0,
      pageNumber: 1,
    });
  }

  return chunks;
}
