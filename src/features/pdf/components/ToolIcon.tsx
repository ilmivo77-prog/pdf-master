import {
  Combine,
  FileCheck2,
  FileImage,
  FileMinus2,
  FileOutput,
  FileSpreadsheet,
  FileText,
  Image,
  Layers,
  Lock,
  Minimize2,
  RotateCw,
  ScanText,
  Scissors,
  Shield,
  Sparkles,
  Unlock,
} from 'lucide-react';
import type {ToolIconName} from '../../../types/tool';

interface ToolIconProps {
  name: ToolIconName;
  className?: string;
}

export function ToolIcon({name, className = 'h-5 w-5'}: ToolIconProps) {
  switch (name) {
    case 'merge':
      return <Combine className={className} aria-hidden="true" />;
    case 'split':
      return <Scissors className={className} aria-hidden="true" />;
    case 'extract':
      return <FileOutput className={className} aria-hidden="true" />;
    case 'remove':
      return <FileMinus2 className={className} aria-hidden="true" />;
    case 'compress':
      return <Minimize2 className={className} aria-hidden="true" />;
    case 'file-text':
      return <FileText className={className} aria-hidden="true" />;
    case 'file-spreadsheet':
      return <FileSpreadsheet className={className} aria-hidden="true" />;
    case 'image':
      return <Image className={className} aria-hidden="true" />;
    case 'images':
      return <FileImage className={className} aria-hidden="true" />;
    case 'rotate-cw':
      return <RotateCw className={className} aria-hidden="true" />;
    case 'lock':
      return <Lock className={className} aria-hidden="true" />;
    case 'unlock':
      return <Unlock className={className} aria-hidden="true" />;
    case 'layers':
      return <Layers className={className} aria-hidden="true" />;
    case 'sparkles':
      return <Sparkles className={className} aria-hidden="true" />;
    case 'scan-text':
      return <ScanText className={className} aria-hidden="true" />;
    case 'edit':
      return <FileCheck2 className={className} aria-hidden="true" />;
    case 'shield':
      return <Shield className={className} aria-hidden="true" />;
    default:
      return <FileText className={className} aria-hidden="true" />;
  }
}
