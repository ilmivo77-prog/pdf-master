export type ToolCategoryId =
  | 'organize-pdf'
  | 'optimize-pdf'
  | 'convert-to-pdf'
  | 'convert-from-pdf'
  | 'edit-pdf'
  | 'security'
  | 'ocr-extraction'
  | 'ai-pdf-tools';

export type ToolStatus = 'available' | 'planned' | 'beta';

export type ProcessingExecutionMode = 'client' | 'server' | 'hybrid';

export type ToolIconName =
  | 'merge'
  | 'split'
  | 'compress'
  | 'file-text'
  | 'file-spreadsheet'
  | 'image'
  | 'images'
  | 'rotate-cw'
  | 'lock'
  | 'unlock'
  | 'layers'
  | 'sparkles'
  | 'scan-text'
  | 'edit'
  | 'shield'
  | 'extract'
  | 'remove';

export interface ToolCategoryDefinition {
  id: ToolCategoryId;
  name: string;
  slug: string;
  description: string;
  icon: ToolIconName;
  accentColorClass: string;
  accentSurfaceClass: string;
  displayOrder: number;
}

export interface PdfToolDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ToolCategoryId;
  icon: ToolIconName;
  route: string;
  supportedInputFormats: string[];
  supportedInputMimeTypes: string[];
  supportedOutputFormats: string[];
  allowMultipleFiles: boolean;
  maxFileSizeBytes: number;
  maxFilesCount: number;
  status: ToolStatus;
  executionMode: ProcessingExecutionMode;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  isFeatured: boolean;
  featured?: boolean;
  popularityRank?: number;
  relatedToolIds?: string[];
}
