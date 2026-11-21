import React, {useState} from 'react';
import {ContentSection} from '../components/layout/ContentSection';
import {PageHero} from '../components/layout/PageHero';
import {SeoHead} from '../components/seo/SeoHead';
import {
  Alert,
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from '../components/ui';
import {SITE_CONFIG, STATIC_ROUTES} from '../config/site';
import {useTranslation} from '../services/localization/i18nService';

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const TOPIC_OPTIONS = [
  {value: 'general', label: 'General Feedback'},
  {value: 'tool-request', label: 'Request a PDF Tool'},
  {value: 'accessibility', label: 'Accessibility Report'},
  {value: 'bug', label: 'Issue Report'},
];

export function ContactPage() {
  const {t} = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [validatedPreview, setValidatedPreview] = useState(false);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!name.trim() || name.trim().length < 2) {
      nextErrors.name = 'Please enter your name (at least 2 characters).';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!message.trim() || message.trim().length < 10) {
      nextErrors.message = 'Please enter a message of at least 10 characters.';
    }
    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setValidatedPreview(true);
    } else {
      setValidatedPreview(false);
    }
  };

  return (
    <>
      <SeoHead
        title={`${t.pages.contactTitle} – ${SITE_CONFIG.brandName}`}
        description="Contact page foundation for PDF Master. Review inquiry validation and platform stage details."
        canonicalPath={STATIC_ROUTES.contact}
      />

      <PageHero
        title={t.pages.contactTitle}
        description="Questions, tool requests, or accessibility feedback help shape upcoming PDF Master milestones."
        containerSize="narrow"
      />

      <ContentSection containerSize="narrow">
        <div className="space-y-6">
          <Alert variant="info">
            Backend message delivery is not yet connected. This form validates your input locally in the browser without storing or transmitting personal data.
          </Alert>

          <Card padding="lg">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <Label htmlFor="contact-name" required>
                  Your Name
                </Label>
                <Input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  hasError={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  className="mt-1.5"
                  placeholder="Jane Smith"
                />
                <FieldError id="contact-name-error">{errors.name}</FieldError>
              </div>

              <div>
                <Label htmlFor="contact-email" required>
                  Email Address
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  hasError={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  className="mt-1.5"
                  placeholder="you@example.com"
                />
                <FieldError id="contact-email-error">{errors.email}</FieldError>
              </div>

              <div>
                <Label htmlFor="contact-topic">Topic</Label>
                <Select
                  id="contact-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  options={TOPIC_OPTIONS}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="contact-message" required>
                  Message
                </Label>
                <Textarea
                  id="contact-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  hasError={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? 'contact-message-error' : undefined
                  }
                  className="mt-1.5"
                  placeholder="Share your feedback or question..."
                />
                <FieldError id="contact-message-error">{errors.message}</FieldError>
              </div>

              <div className="pt-1">
                <Button type="submit" variant="primary">
                  Validate Message
                </Button>
              </div>

              {validatedPreview && (
                <Alert variant="success">
                  Form validation succeeded locally. Because a backend mail service is not yet enabled, no message was transmitted or stored.
                </Alert>
              )}
            </form>
          </Card>
        </div>
      </ContentSection>
    </>
  );
}
