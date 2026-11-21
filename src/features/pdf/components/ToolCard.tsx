import {ArrowRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Badge, Card} from '../../../components/ui';
import {DESIGN_TOKENS} from '../../../config/designTokens';
import {getCategoryById} from '../../../config/toolsRegistry';
import {useTranslation} from '../../../services/localization/i18nService';
import type {PdfToolDefinition} from '../../../types/tool';
import {ToolIcon} from './ToolIcon';

interface ToolCardProps {
  tool: PdfToolDefinition;
}

export function ToolCard({tool}: ToolCardProps) {
  const {t, buildPath} = useTranslation();
  const category = getCategoryById(tool.category);
  const categoryAccent = DESIGN_TOKENS.colors.categories[tool.category];

  const statusLabel =
    tool.status === 'available'
      ? t.toolsDirectory.statusAvailable
      : tool.status === 'beta'
        ? t.toolsDirectory.statusBeta
        : t.toolsDirectory.statusPlanned;

  const badgeVariant =
    tool.status === 'available'
      ? 'success'
      : tool.status === 'beta'
        ? 'info'
        : 'warning';

  const formatSummary = `${tool.supportedInputFormats.join(', ').toUpperCase()} to ${tool.supportedOutputFormats.join(', ').toUpperCase()}`;

  return (
    <Link
      to={buildPath(tool.route)}
      className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      <Card interactive padding="md" className="flex h-full flex-col justify-between p-5 sm:p-5">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${categoryAccent.surface} ${categoryAccent.text}`}
            >
              <ToolIcon name={tool.icon} className="h-5 w-5" />
            </div>
            <Badge variant={badgeVariant} size="sm">
              {statusLabel}
            </Badge>
          </div>

          <h3 className="text-base font-semibold text-slate-900 transition-colors duration-150 group-hover:text-blue-700">
            {tool.name}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {tool.description}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5 text-xs text-slate-500">
          <span className="truncate font-mono">
            {category?.name} · {formatSummary}
          </span>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-blue-700 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </Card>
    </Link>
  );
}
