import {Bell, Download, FileQuestion, Info, Mail, Plus, Settings, Trash2} from 'lucide-react';
import {useState} from 'react';
import {PdfMasterLogo} from '../components/brand/PdfMasterLogo';
import {ContentSection} from '../components/layout/ContentSection';
import {PageHero} from '../components/layout/PageHero';
import {SeoHead} from '../components/seo/SeoHead';
import {
  Accordion,
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Drawer,
  EmptyState,
  FieldError,
  HelpText,
  IconButton,
  Input,
  Label,
  Modal,
  Pagination,
  ProgressBar,
  Radio,
  RadioGroup,
  SectionHeading,
  Select,
  Skeleton,
  Spinner,
  Switch,
  Tabs,
  Textarea,
  Tooltip,
  useToast,
} from '../components/ui';
import {DESIGN_TOKENS} from '../config/designTokens';
import {SITE_CONFIG} from '../config/site';
import {getAllCategories} from '../config/toolsRegistry';
import {FileDropzone} from '../features/pdf/components/FileDropzone';

export function DesignSystemPage() {
  const {showToast} = useToast();
  const [switchValue, setSwitchValue] = useState(true);
  const [checkboxValue, setCheckboxValue] = useState(true);
  const [radioValue, setRadioValue] = useState('recommended');
  const [currentPage, setCurrentPage] = useState(2);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(64);

  const categories = getAllCategories();

  return (
    <>
      <SeoHead
        title={`Design System – ${SITE_CONFIG.brandName}`}
        description="Internal UI/UX design system showcase for PDF Master development."
        robots="noindex"
        includeHreflang={false}
      />

      <PageHero
        eyebrow="Development Showcase"
        title="PDF Master Design System"
        description="Reference catalog of brand identity, tokens, typography, accessible UI primitives, and interactive states."
        containerSize="wide"
      />

      {/* Brand & Palette */}
      <ContentSection containerSize="wide" spacing="compact">
        <SectionHeading
          title="1. Brand Identity & Color Tokens"
          subtitle="Cobalt Blue primary palette with WCAG AA slate typography and category accents."
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card padding="md">
            <CardHeader>
              <CardTitle>Logo Sizes</CardTitle>
              <CardDescription>Inline SVG logomark and wordmark.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <PdfMasterLogo size="sm" />
              </div>
              <div>
                <PdfMasterLogo size="md" />
              </div>
              <div>
                <PdfMasterLogo size="lg" />
              </div>
              <div className="pt-1">
                <PdfMasterLogo size="md" showWordmark={false} />
              </div>
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Brand & Neutral Swatches</CardTitle>
              <CardDescription>Primary Cobalt and Slate neutral scale.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2.5 text-xs">
              {Object.entries(DESIGN_TOKENS.colors.brand).map(([shade, hex]) => (
                <div key={shade} className="flex items-center gap-2">
                  <span
                    className="h-6 w-6 shrink-0 rounded border border-slate-200"
                    style={{backgroundColor: hex}}
                  />
                  <span className="font-mono text-slate-700">
                    brand-{shade} ({hex})
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Category Accents</CardTitle>
              <CardDescription>Distinct soft surfaces for 8 categories.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 text-xs">
              {categories.map((cat) => {
                const accent = DESIGN_TOKENS.colors.categories[cat.id];
                return (
                  <div key={cat.id} className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800">{cat.name}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono font-medium ${accent.surface} ${accent.text}`}
                    >
                      {accent.hex}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      {/* Typography & Spacing */}
      <ContentSection surface="white" bordered containerSize="wide" spacing="compact">
        <SectionHeading
          title="2. Typography & Spacing Scale"
          subtitle="Plus Jakarta Sans headings, DM Sans prose, and JetBrains Mono tabular figures."
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card padding="md" className="lg:col-span-8 space-y-4">
            <p className={DESIGN_TOKENS.typography.scale.h1Page}>
              Page Heading (H1) — All Your PDF Tools
            </p>
            <p className={DESIGN_TOKENS.typography.scale.h2Section}>
              Section Heading (H2) — Organized Workflows
            </p>
            <p className={DESIGN_TOKENS.typography.scale.h3Card}>
              Card Heading (H3) — Merge PDF Documents
            </p>
            <p className={DESIGN_TOKENS.typography.scale.bodyLead}>
              Body Lead — Clear, legible descriptions built for non-technical users.
            </p>
            <p className={DESIGN_TOKENS.typography.scale.bodyRegular}>
              Body Regular — Standard paragraph copy with 1.6 line height and high-contrast slate ink.
            </p>
            <p className={DESIGN_TOKENS.typography.scale.monoMeta}>
              Mono Tabular — 24.5 MB · 1,280 pages · .PDF to .DOCX
            </p>
          </Card>

          <Card padding="md" className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Spacing Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {Object.entries(DESIGN_TOKENS.spacing.scale).map(([token, rem]) => (
                <div key={token} className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono text-slate-700">{token}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 rounded bg-blue-700"
                      style={{width: rem}}
                    />
                    <span className="font-mono tabular-nums text-slate-500">
                      {rem}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      {/* Buttons & IconButtons */}
      <ContentSection containerSize="wide" spacing="compact">
        <SectionHeading
          title="3. Buttons & Icon Controls"
          subtitle="Five variants, three sizes, loading/disabled states, and minimum 44px mobile touch targets."
        />

        <Card padding="md" className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link Button</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Small
            </Button>
            <Button size="md" rightIcon={<Download className="h-4 w-4" />}>
              Medium
            </Button>
            <Button size="lg">Large</Button>
            <Button isLoading loadingText="Processing...">
              Loading
            </Button>
            <Button disabled>Disabled</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <IconButton
              variant="primary"
              aria-label="Download file"
              icon={<Download className="h-4 w-4" />}
            />
            <IconButton
              variant="secondary"
              aria-label="Settings"
              icon={<Settings className="h-4 w-4" />}
            />
            <IconButton
              variant="ghost"
              aria-label="Notifications"
              icon={<Bell className="h-4 w-4" />}
            />
            <IconButton
              variant="danger"
              aria-label="Delete item"
              icon={<Trash2 className="h-4 w-4" />}
            />
            <IconButton
              variant="secondary"
              isLoading
              aria-label="Loading action"
              icon={<Settings className="h-4 w-4" />}
            />
          </div>
        </Card>
      </ContentSection>

      {/* Form Controls */}
      <ContentSection surface="white" bordered containerSize="wide" spacing="compact">
        <SectionHeading
          title="4. Form Controls"
          subtitle="Accessible labels, error states, help text, selects, checkboxes, radios, and switches."
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card padding="md" className="space-y-4">
            <div>
              <Label htmlFor="ds-input" required>
                Document Title
              </Label>
              <Input
                id="ds-input"
                placeholder="Quarterly-Report.pdf"
                leftElement={<Mail className="h-4 w-4" />}
                className="mt-1.5"
              />
              <HelpText>Filenames are sanitized automatically.</HelpText>
            </div>

            <div>
              <Label htmlFor="ds-input-err">Error State Input</Label>
              <Input
                id="ds-input-err"
                defaultValue="invalid-file.exe"
                hasError
                className="mt-1.5"
              />
              <FieldError>Unsupported extension. Only .pdf is allowed.</FieldError>
            </div>

            <div>
              <Label htmlFor="ds-select">Output Format</Label>
              <Select
                id="ds-select"
                className="mt-1.5"
                options={[
                  {value: 'pdf', label: 'Standard PDF (.pdf)'},
                  {value: 'pdfa', label: 'Archival PDF/A (.pdf)'},
                  {value: 'docx', label: 'Word Document (.docx)'},
                ]}
              />
            </div>

            <div>
              <Label htmlFor="ds-textarea">Notes</Label>
              <Textarea
                id="ds-textarea"
                rows={3}
                placeholder="Optional document notes..."
                className="mt-1.5"
              />
            </div>
          </Card>

          <Card padding="md" className="space-y-5">
            <Checkbox
              checked={checkboxValue}
              onChange={(e) => setCheckboxValue(e.target.checked)}
              label="Preserve bookmarks when merging"
              description="Keep existing table-of-contents outlines where available."
            />

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-medium text-slate-900">
                Compression Preset
              </p>
              <RadioGroup label="Compression preset">
                <Radio
                  name="ds-compression"
                  value="low"
                  checked={radioValue === 'low'}
                  onChange={() => setRadioValue('low')}
                  label="Low Compression"
                  description="Highest image fidelity, larger output file."
                />
                <Radio
                  name="ds-compression"
                  value="recommended"
                  checked={radioValue === 'recommended'}
                  onChange={() => setRadioValue('recommended')}
                  label="Recommended Balance"
                  description="Balanced quality and reduced file size."
                />
              </RadioGroup>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <Switch
                checked={switchValue}
                onCheckedChange={setSwitchValue}
                label="Local Browser Validation"
                description="Verify file extensions and sizes before queueing."
              />
            </div>
          </Card>
        </div>
      </ContentSection>

      {/* Feedback, Badges, Progress & Skeletons */}
      <ContentSection containerSize="wide" spacing="compact">
        <SectionHeading
          title="5. Badges, Alerts, Progress & Loaders"
          subtitle="WCAG AA status indicators, determinate/indeterminate progress bars, and toast triggers."
        />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card padding="md" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Available</Badge>
              <Badge variant="warning">Coming soon</Badge>
              <Badge variant="danger">Error</Badge>
              <Badge variant="info">Beta</Badge>
            </div>

            <Alert variant="info" title="Information">
              Files remain inside your browser session in this foundation release.
            </Alert>
            <Alert variant="success" title="Validation Passed">
              Sample PDF passed extension and size checks.
            </Alert>
            <Alert variant="warning" title="Planned Feature">
              Processing engine integration is scheduled for an upcoming milestone.
            </Alert>
            <Alert variant="danger" title="Validation Failed">
              Selected file exceeds the 25 MB limit.
            </Alert>
          </Card>

          <Card padding="md" className="space-y-5">
            <div className="flex items-center gap-4">
              <Spinner size="xs" />
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <span className="text-xs text-slate-600">Accessible Spinners</span>
            </div>

            <ProgressBar
              label="Determinate Upload Queue"
              value={progressValue}
              showValue
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setProgressValue((p) => Math.max(0, p - 20))}
              >
                -20%
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setProgressValue((p) => Math.min(100, p + 20))}
              >
                +20%
              </Button>
            </div>

            <ProgressBar label="Indeterminate Worker State" indeterminate />

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <Skeleton variant="text" className="w-1/2" />
              <Skeleton variant="text" className="w-full" />
              <Skeleton variant="rect" className="h-14" />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  showToast({
                    title: 'Info Toast',
                    description: 'Announced via aria-live polite region.',
                    variant: 'info',
                  })
                }
              >
                Trigger Info Toast
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  showToast({
                    title: 'File Queued',
                    description: 'sample.pdf passed local validation.',
                    variant: 'success',
                  })
                }
              >
                Trigger Success Toast
              </Button>
            </div>
          </Card>
        </div>
      </ContentSection>

      {/* Navigation, Tabs, Accordion, Overlays & Dropzone */}
      <ContentSection surface="white" bordered containerSize="wide" spacing="compact">
        <SectionHeading
          title="6. Navigation, Disclosure & Overlays"
          subtitle="Keyboard-navigable Tabs, Accordion, Breadcrumbs, Pagination, Tooltip, Modal, and Drawer."
        />

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card padding="md" className="space-y-5">
              <Breadcrumbs
                items={[
                  {label: 'Home', to: '/'},
                  {label: 'Tools', to: '/tools'},
                  {label: 'Merge PDF'},
                ]}
              />

              <Tabs
                ariaLabel="Showcase tabs"
                items={[
                  {
                    id: 'overview',
                    label: 'Overview',
                    content: (
                      <p className="text-sm text-slate-600">
                        Use Left/Right arrow keys, Home, or End to navigate between tabs.
                      </p>
                    ),
                  },
                  {
                    id: 'options',
                    label: 'Options',
                    content: (
                      <p className="text-sm text-slate-600">
                        Supports RTL arrow reversal automatically when dir=&quot;rtl&quot;.
                      </p>
                    ),
                  },
                  {
                    id: 'disabled',
                    label: 'Disabled',
                    disabled: true,
                    content: null,
                  },
                ]}
              />

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
                <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
                  Open Drawer
                </Button>
                <Tooltip content="Keyboard and hover tooltip">
                  <Button variant="ghost" leftIcon={<Info className="h-4 w-4" />}>
                    Focus or Hover Me
                  </Button>
                </Tooltip>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={5}
                onPageChange={setCurrentPage}
                className="justify-start pt-2"
              />
            </Card>

            <div className="space-y-5">
              <Accordion
                defaultOpenIds={['faq-1']}
                items={[
                  {
                    id: 'faq-1',
                    title: 'How does keyboard focus work in overlays?',
                    content:
                      'Modal and Drawer trap Tab navigation inside the dialog, close on Escape, lock body scroll, and return focus to the trigger button.',
                  },
                  {
                    id: 'faq-2',
                    title: 'How does RTL layout support work?',
                    content:
                      'All UI components use Tailwind logical spacing and directional properties (ps-, pe-, start-, end-, rtl:rotate-180).',
                  },
                ]}
              />

              <EmptyState
                icon={<FileQuestion className="h-6 w-6" />}
                title="Empty State Pattern"
                description="Shown cleanly when search queries or filters match no tools."
                action={<Button size="sm">Reset Filters</Button>}
              />
            </div>
          </div>

          <Card padding="md">
            <CardHeader>
              <CardTitle>FileDropzone States (Idle & Disabled)</CardTitle>
              <CardDescription>
                Interactive idle dropzone on the left; disabled state on the right.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <FileDropzone
                toolName="Design System Demo"
                validationRule={{
                  allowedExtensions: ['.pdf'],
                  allowedMimeTypes: ['application/pdf'],
                  maxFileSizeBytes: 10 * 1024 * 1024,
                  maxFilesCount: 3,
                  allowMultiple: true,
                }}
              />
              <FileDropzone
                toolName="Disabled Demo"
                disabled
                validationRule={{
                  allowedExtensions: ['.pdf'],
                  allowedMimeTypes: ['application/pdf'],
                  maxFileSizeBytes: 10 * 1024 * 1024,
                  maxFilesCount: 1,
                  allowMultiple: false,
                }}
              />
            </CardContent>
            <CardFooter>
              <span className="text-xs text-slate-500">
                Available only in development builds (import.meta.env.DEV).
              </span>
            </CardFooter>
          </Card>
        </div>
      </ContentSection>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Accessible Modal Dialog"
        description="Focus is trapped inside this modal until closed via Escape, backdrop, or button."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          Closing this dialog returns keyboard focus directly to the &quot;Open Modal&quot; button.
        </p>
      </Modal>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Accessible Drawer"
        placement="end"
      >
        <p className="text-sm leading-relaxed text-slate-600">
          This slide-over drawer uses logical end positioning so it flips automatically in RTL layouts.
        </p>
      </Drawer>
    </>
  );
}
