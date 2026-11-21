import {FileWarning, Play, Upload} from 'lucide-react';
import React, {useId, useState} from 'react';
import {ContentSection} from '../components/layout/ContentSection';
import {PageHero} from '../components/layout/PageHero';
import {SeoHead} from '../components/seo/SeoHead';
import {Alert, Button, Card, Radio, RadioGroup} from '../components/ui';
import {PROCESSING_LIMITS} from '../config/processingLimits';
import {SITE_CONFIG} from '../config/site';
import {ErrorPanel} from '../features/pdf/components/ErrorPanel';
import {ProcessingPanel} from '../features/pdf/components/ProcessingPanel';
import {ResultPanel} from '../features/pdf/components/ResultPanel';
import {useProcessingJob} from '../features/pdf/hooks/useProcessingJob';
import {formatBytes} from '../services/file/fileValidation';

type PipelineMode = 'inspect' | 'roundtrip';

export function DevPipelinePage() {
  const fileInputId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<PipelineMode>('inspect');

  const {job, elapsedMs, isRunning, startJob, cancelJob, discardResults} =
    useProcessingJob();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    event.target.value = '';
  };

  const runWithFile = (file: File, targetMode: PipelineMode) => {
    const toolId =
      targetMode === 'roundtrip'
        ? 'internal:pdf-roundtrip'
        : 'internal:pdf-inspect';

    void startJob({
      toolId,
      files: [file],
      options: {mode: targetMode},
      limits: {
        maxFileSizeBytes: PROCESSING_LIMITS.devTestMaxFileSizeBytes,
        maxTotalSizeBytes: PROCESSING_LIMITS.devTestMaxFileSizeBytes,
        maxFilesCount: 1,
      },
      requirePdfMagicBytes: true,
    });
  };

  const handleRunSelected = () => {
    if (!selectedFile) {
      return;
    }
    runWithFile(selectedFile, mode);
  };

  const handleTriggerFakePdfFailure = () => {
    const spoofedFile = new File(
      ['MZ\u0090\u0000This is not a real PDF document'],
      'renamed-executable.pdf',
      {type: 'application/pdf'}
    );
    setSelectedFile(spoofedFile);
    runWithFile(spoofedFile, mode);
  };

  return (
    <>
      <SeoHead
        title={`Dev Pipeline Harness – ${SITE_CONFIG.brandName}`}
        description="Development-only Web Worker PDF processing infrastructure harness."
        robots="noindex"
        includeHreflang={false}
      />

      <PageHero
        eyebrow="Development Only (import.meta.env.DEV)"
        title="Core PDF Worker Pipeline Harness"
        description="Internal Milestone 4 test harness exercising Web Worker execution, magic-byte validation, progress throttling, cancellation, roundtrip download, and memory cleanup."
        containerSize="standard"
      />

      <ContentSection containerSize="standard" spacing="compact">
        <div className="space-y-6">
          <Alert variant="info" title="Internal Self-Test Only">
            This route is disabled in production builds and uses the internal{' '}
            <code>pdf-inspect</code> / <code>pdf-roundtrip</code> worker engine.
            Public PDF tools remain in Coming soon status.
          </Alert>

          <Card padding="md" className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor={fileInputId}
                className="block text-sm font-semibold text-slate-900"
              >
                1. Choose a PDF file (or any renamed file to test validation)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id={fileInputId}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  disabled={isRunning}
                  className="block w-full max-w-md text-sm text-slate-700 file:me-4 file:min-h-[44px] file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-slate-50"
                />
                {selectedFile && (
                  <span className="font-mono text-xs text-slate-600">
                    {selectedFile.name} · {formatBytes(selectedFile.size)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Max dev test size:{' '}
                {formatBytes(PROCESSING_LIMITS.devTestMaxFileSizeBytes)}. File
                bytes are read lazily only when you start the job.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <RadioGroup label="2. Select worker test mode">
                <Radio
                  name="dev-pipeline-mode"
                  value="inspect"
                  checked={mode === 'inspect'}
                  onChange={() => setMode('inspect')}
                  disabled={isRunning}
                  label="pdf-inspect (Inspect metadata & page count)"
                  description="Verifies %PDF- header, loads in pdf-lib inside Web Worker, and reports page count, password flag, and metadata."
                />
                <Radio
                  name="dev-pipeline-mode"
                  value="roundtrip"
                  checked={mode === 'roundtrip'}
                  onChange={() => setMode('roundtrip')}
                  disabled={isRunning}
                  label="pdf-roundtrip (Re-save PDF via pdf-lib)"
                  description="Exercises the full browser pipeline from worker processing to downloadable OutputFile and ObjectURL cleanup."
                />
              </RadioGroup>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <Button
                variant="primary"
                disabled={!selectedFile || isRunning}
                leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}
                onClick={handleRunSelected}
              >
                Run Worker Job
              </Button>

              <Button
                variant="secondary"
                disabled={isRunning}
                leftIcon={<FileWarning className="h-4 w-4" aria-hidden="true" />}
                onClick={handleTriggerFakePdfFailure}
              >
                Trigger NOT_A_PDF Failure
              </Button>

              {job.status !== 'idle' && !isRunning && (
                <Button
                  variant="ghost"
                  leftIcon={<Upload className="h-4 w-4" aria-hidden="true" />}
                  onClick={discardResults}
                >
                  Reset Harness
                </Button>
              )}
            </div>
          </Card>

          <ProcessingPanel
            job={job}
            elapsedMs={elapsedMs}
            onCancel={cancelJob}
          />

          {job.status === 'succeeded' && job.result && (
            <ResultPanel result={job.result} onDiscard={discardResults} />
          )}

          {(job.status === 'failed' || job.status === 'cancelled') &&
            job.error && (
              <ErrorPanel
                error={job.error}
                onRetry={selectedFile ? handleRunSelected : undefined}
              />
            )}
        </div>
      </ContentSection>
    </>
  );
}
