import React from 'react';
import {Link} from 'react-router-dom';
import {STATIC_ROUTES} from '../../config/site';
import {useTranslation} from '../../services/localization/i18nService';
import type {PdfToolDefinition, ToolCategoryDefinition} from '../../types/tool';
import {ToolIcon} from '../../features/pdf/components/ToolIcon';
import {ToolCard} from '../../features/pdf/components/ToolCard';
import {
  Accordion,
  Alert,
  Badge,
  Breadcrumbs,
  Container,
  type AccordionItem,
} from '../ui';

export interface ToolPageLayoutProps {
  tool: PdfToolDefinition;
  category?: ToolCategoryDefinition;
  executionLabel: string;
  relatedTools: PdfToolDefinition[];
  faqItems?: AccordionItem[];
  workspace: React.ReactNode;
}

export function ToolPageLayout({
  tool,
  category,
  executionLabel,
  relatedTools,
  faqItems = [],
  workspace,
}: ToolPageLayoutProps) {
  const {t, buildPath} = useTranslation();
  const isPlanned = tool.status === 'planned';

  const statusBadgeVariant =
    tool.status === 'available'
      ? 'success'
      : tool.status === 'beta'
        ? 'info'
        : 'warning';

  const statusLabel =
    tool.status === 'available'
      ? t.toolsDirectory.statusAvailable
      : tool.status === 'beta'
        ? t.toolsDirectory.statusBeta
        : t.toolsDirectory.statusPlanned;

  return (
    <>
      <section className="border-b border-slate-200 bg-white py-10 sm:py-12">
        <Container size="standard">
          <Breadcrumbs
            className="mb-6"
            items={[
              {label: t.toolLanding.breadcrumbHome, to: buildPath(STATIC_ROUTES.home)},
              {label: t.toolLanding.breadcrumbTools, to: buildPath(STATIC_ROUTES.tools)},
              {label: tool.name},
            ]}
          />

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${category?.accentSurfaceClass ?? 'bg-slate-100'} ${category?.accentColorClass ?? 'text-slate-700'}`}
              >
                <ToolIcon name={tool.icon} className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-medium text-slate-600">
                    {category?.name}
                  </span>
                  <Badge variant={statusBadgeVariant} size="sm">
                    {statusLabel}
                  </Badge>
                </div>
                <h1 className="mt-1.5 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  {tool.name}
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
                  {tool.description}
                </p>
              </div>
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">
                {t.toolLanding.supportedInputsLabel}
              </dt>
              <dd className="mt-1 font-mono text-sm font-medium text-slate-900">
                {tool.supportedInputFormats.join(', ').toUpperCase()}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">
                {t.toolLanding.supportedOutputsLabel}
              </dt>
              <dd className="mt-1 font-mono text-sm font-medium text-slate-900">
                {tool.supportedOutputFormats.join(', ').toUpperCase()}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">
                {t.toolLanding.executionTargetLabel}
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {executionLabel}
              </dd>
            </div>
          </dl>
        </Container>
      </section>

      <section className="py-10 sm:py-12">
        <Container size="standard" className="space-y-8">
          {isPlanned && (
            <Alert variant="info" title={t.toolLanding.foundationNoticeTitle}>
              {t.toolLanding.foundationNoticeBody}
            </Alert>
          )}

          {workspace}
        </Container>
      </section>

      {faqItems.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-12 sm:py-14">
          <Container size="standard">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Planned capabilities and current file validation behavior for {tool.name}.
            </p>
            <div className="mt-6">
              <Accordion items={faqItems} />
            </div>
          </Container>
        </section>
      )}

      {relatedTools.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50 py-12 sm:py-14">
          <Container size="standard">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {t.toolLanding.relatedToolsTitle}
              </h2>
              <Link
                to={buildPath(STATIC_ROUTES.tools)}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
              >
                {t.toolLanding.backToDirectory} &rarr;
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {relatedTools.map((related) => (
                <ToolCard key={related.id} tool={related} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
