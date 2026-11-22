import type {AccordionItem} from '../components/ui';
import {EN_COMMON_DICTIONARY} from '../locales/en/common';
import {formatBytes} from '../services/file/fileValidation';
import {PROCESSING_LIMITS} from './processingLimits';

export interface ToolRichContent {
  overview: string;
  steps: Array<{title: string; description: string}>;
  acceptedInputsSummary: string;
  optionsExplained: Array<{name: string; detail: string}>;
  limitations: string[];
  faqs: AccordionItem[];
}

const INTERACTIVE_NOTE = EN_COMMON_DICTIONARY.processing.interactiveFeaturesNote;

export function getToolRichContent(toolId: string): ToolRichContent | null {
  const maxFileSize = formatBytes(PROCESSING_LIMITS.maxFileSizeBytes);
  const maxTotalSize = formatBytes(PROCESSING_LIMITS.maxTotalSizeBytes);
  const maxFiles = PROCESSING_LIMITS.maxFilesCount;
  const maxSplitOutputs = PROCESSING_LIMITS.maxSplitOutputs;

  switch (toolId) {
    case 'merge-pdf':
      return {
        overview:
          'Merge PDF combines two or more separate PDF documents into a single continuous file directly inside a browser Web Worker. You control the exact document sequence before processing, and page counts are inspected in advance so you know the combined page total before downloading.',
        steps: [
          {
            title: 'Select 2 or more PDF files',
            description: `Choose between 2 and ${maxFiles} unrestricted PDF documents (up to ${maxFileSize} each and ${maxTotalSize} combined).`,
          },
          {
            title: 'Verify page counts',
            description:
              'Each file header and structure is inspected automatically in the background worker to show its page count.',
          },
          {
            title: 'Arrange the merge order',
            description:
              'Use the Move up and Move down buttons on any queued file to adjust the order pages will appear in merged.pdf.',
          },
          {
            title: 'Merge and download',
            description:
              'Click Merge PDFs to assemble merged.pdf in session memory, download the result, and discard session memory when finished.',
          },
        ],
        acceptedInputsSummary: `Standard unrestricted PDF (.pdf) documents only. Accepts 2 to ${maxFiles} files per run, up to ${maxFileSize} per file and ${maxTotalSize} total combined payload.`,
        optionsExplained: [
          {
            name: 'Move up / Move down ordering',
            detail:
              'Reorders queued files from top to bottom before merging. All pages from the first file appear first, followed by subsequent files in sequence.',
          },
        ],
        limitations: [
          INTERACTIVE_NOTE,
          'PDFs with encryption or permission restrictions are rejected; PDF Master does not unlock restricted files.',
          `Browser worker limits (${maxFileSize} per file, ${maxTotalSize} total, ${maxFiles} files max) are conservative and large documents may fail on low-memory phones.`,
        ],
        faqs: [
          {
            id: 'merge-how-many',
            title: 'How many PDF files can I merge at once?',
            content: `You can merge between 2 and ${maxFiles} PDF files per job, as long as each file is at most ${maxFileSize} and the combined size stays within ${maxTotalSize}.`,
          },
          {
            id: 'merge-order',
            title: 'Can I reorder files before merging?',
            content:
              'Yes. Every queued file includes keyboard-accessible Move up and Move down buttons so you can set the exact sequence before clicking Merge PDFs.',
          },
          {
            id: 'merge-privacy',
            title: 'Where does PDF merging happen?',
            content:
              'Merging runs inside your browser’s own Web Worker code. Files are not sent to a server by PDF Master, and merged.pdf exists only in browser session memory until you download or discard it. When delivering the site, the hosting provider may keep standard server logs such as IP address and requested URL.',
          },
          {
            id: 'merge-locked',
            title: 'Why are protected or restricted PDFs rejected?',
            content:
              'PDF Master requires PDF files without encryption or permission restrictions so pages can be copied cleanly. Remove those restrictions in your PDF viewer first.',
          },
        ],
      };

    case 'split-pdf':
      return {
        overview:
          'Split PDF divides a single multi-page PDF document into separate smaller PDF files using custom page ranges, fixed N-page chunks, or single-page separation. When your configuration produces multiple PDFs, the worker packages them into a single ZIP archive alongside individual downloads.',
        steps: [
          {
            title: 'Choose one PDF file',
            description: `Select a single unrestricted PDF up to ${maxFileSize}.`,
          },
          {
            title: 'Select a split mode',
            description:
              'Pick Custom page ranges, Every N pages, or Every page separately depending on how you want the document divided.',
          },
          {
            title: 'Check live output preview',
            description: `Verify your range syntax or chunk count stays within the ${maxSplitOutputs}-file output ceiling.`,
          },
          {
            title: 'Split and download',
            description:
              'Download the single PDF directly if 1 group was specified, or download individual PDFs or the ZIP bundle when multiple files are created.',
          },
        ],
        acceptedInputsSummary: `Single unrestricted PDF (.pdf) up to ${maxFileSize}. Output is capped at ${maxSplitOutputs} split PDF files per run.`,
        optionsExplained: [
          {
            name: 'Custom page ranges',
            detail:
              'Comma-separated 1-based ranges (such as "1-3, 5, 8-10"). Each comma group creates one separate output PDF.',
          },
          {
            name: 'Every N pages',
            detail:
              'Divides the document into consecutive N-page files (for example, every 2 pages turns a 5-page PDF into 2+2+1 page files).',
          },
          {
            name: 'Every page separately',
            detail: `Creates one individual PDF per page for documents up to ${maxSplitOutputs} pages.`,
          },
        ],
        limitations: [
          INTERACTIVE_NOTE,
          `Split output count is capped at ${maxSplitOutputs} files per job to keep browser worker memory stable.`,
          'PDFs with encryption or permission restrictions cannot be split; remove those restrictions in your PDF viewer first.',
        ],
        faqs: [
          {
            id: 'split-zip-or-pdf',
            title: 'When do I get a ZIP archive versus a single PDF?',
            content:
              'If your split selection produces 1 output group, Split PDF returns that PDF directly. When 2 or more outputs are produced, the worker packages them into a downloadable ZIP archive and also lists each split PDF.',
          },
          {
            id: 'split-max-outputs',
            title: 'Why is there a maximum number of split files?',
            content: `Each split PDF allocates separate document structures in browser worker memory before ZIP packaging, so Split PDF caps output count at ${maxSplitOutputs} files per run.`,
          },
          {
            id: 'split-syntax',
            title: 'How should I format custom page ranges?',
            content:
              'Use 1-based page numbers separated by commas and hyphens, such as "1-3, 5, 8-10". Reversed ranges like "5-2" or pages higher than the document count are flagged immediately.',
          },
          {
            id: 'split-privacy',
            title: 'Are split files stored on a server?',
            content:
              'No. Splitting runs inside your browser Web Worker and outputs remain only in browser memory for your active session. When loading the web page itself, the hosting provider may keep standard server logs such as IP address and requested URL.',
          },
        ],
      };

    case 'extract-pages':
      return {
        overview:
          'Extract Pages pulls only the specific pages or ranges you specify from an unrestricted PDF and writes them into one new PDF document in the exact sequence you listed, omitting duplicate mentions automatically.',
        steps: [
          {
            title: 'Add a PDF document',
            description: `Select one unrestricted PDF up to ${maxFileSize}.`,
          },
          {
            title: 'Enter pages to extract',
            description:
              'Type 1-based page numbers or ranges such as "5, 1-3, 8-10". Live validation checks bounds against the inspected page count.',
          },
          {
            title: 'Run extraction',
            description:
              'Click Extract Pages to build the new PDF inside the browser Web Worker.',
          },
          {
            title: 'Download extracted PDF',
            description:
              'Download the generated document containing only your chosen pages in order.',
          },
        ],
        acceptedInputsSummary: `Single unrestricted PDF (.pdf) up to ${maxFileSize}. Outputs one new PDF (.pdf).`,
        optionsExplained: [
          {
            name: 'Pages to extract (order preserved)',
            detail:
              'Pages are copied in the first-seen order you write (e.g., "5, 1-3" places page 5 first, followed by pages 1, 2, and 3). Overlapping or repeated pages are automatically deduplicated.',
          },
        ],
        limitations: [
          INTERACTIVE_NOTE,
          'Only valid 1-based ASCII numbers, hyphens, and commas are accepted.',
          `Files larger than ${maxFileSize} or PDFs with encryption or permission restrictions are rejected.`,
        ],
        faqs: [
          {
            id: 'extract-order',
            title: 'Does Extract Pages keep the order I type?',
            content:
              'Yes. If you enter "5, 1-3", page 5 appears first in the output PDF, followed by pages 1, 2, and 3. Any repeated page number is included only once at its first position.',
          },
          {
            id: 'extract-vs-split',
            title: 'What is the difference between Extract Pages and Split PDF?',
            content:
              'Extract Pages always combines your selected pages into one output PDF, whereas Split PDF creates a separate output file for each range group or chunk.',
          },
          {
            id: 'extract-limits',
            title: 'What limits apply to Extract Pages?',
            content: `Each input PDF must be free of encryption and permission restrictions and at most ${maxFileSize}. Browser memory limits are conservative and very dense documents may fail on low-memory phones.`,
          },
        ],
      };

    case 'remove-pages':
      return {
        overview:
          'Remove Pages deletes unwanted pages or ranges from a PDF and saves all remaining pages in their original sequence. Built-in validation checks verify that at least one page always remains in the finished PDF.',
        steps: [
          {
            title: 'Select a PDF document',
            description: `Choose one unrestricted PDF file up to ${maxFileSize}.`,
          },
          {
            title: 'Specify pages to remove',
            description:
              'Enter the page numbers or ranges you want deleted (for example: "1, 4-6").',
          },
          {
            title: 'Confirm remaining page count',
            description:
              'Live feedback shows how many pages will be deleted and how many pages remain.',
          },
          {
            title: 'Remove pages and download',
            description:
              'Click Remove Pages to create and download the updated PDF.',
          },
        ],
        acceptedInputsSummary: `Single unrestricted PDF (.pdf) up to ${maxFileSize}. Outputs one trimmed PDF (.pdf) with at least 1 page.`,
        optionsExplained: [
          {
            name: 'Pages to delete',
            detail:
              'Any valid 1-based range list (such as "2, 5-7"). All pages not listed are preserved in original order. Selecting every page is blocked before execution.',
          },
        ],
        limitations: [
          INTERACTIVE_NOTE,
          'You cannot remove every page from a PDF; at least one page must remain.',
          `Browser worker memory limits (${maxFileSize} max) apply and PDFs with encryption or permission restrictions are rejected.`,
        ],
        faqs: [
          {
            id: 'remove-all',
            title: 'What happens if I select all pages for removal?',
            content:
              'Remove Pages prevents removing every page in a document because PDF files must contain at least one page. Both the workspace validation and engine reject full-document removal.',
          },
          {
            id: 'remove-original',
            title: 'Is my original PDF file overwritten?',
            content:
              'No. PDF Master reads a copy inside browser memory and generates a separate trimmed output file for download without modifying your source file on disk.',
          },
          {
            id: 'remove-privacy',
            title: 'Are pages uploaded anywhere during removal?',
            content:
              'No. Processing executes inside your browser Web Worker and outputs stay only in session memory. When loading the web app itself, the hosting provider may keep standard server logs such as IP address and requested URL.',
          },
        ],
      };

    default:
      return null;
  }
}
