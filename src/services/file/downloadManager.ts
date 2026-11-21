import type {PdfOutputArtifact} from '../../types/pdf';
import {sanitizeFileName} from './fileValidation';

export function triggerBlobDownload(artifact: PdfOutputArtifact): void {
  const safeName = sanitizeFileName(artifact.fileName);
  const objectUrl = URL.createObjectURL(artifact.blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = safeName;
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }
}
