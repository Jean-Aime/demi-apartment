import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, Mail } from 'lucide-react';

const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.email('Enter a valid email address'),
  subject: z.string().min(1, 'Choose a subject'),
  message: z.string().trim().min(10, 'Tell us a little about your enquiry').max(1200),
});

type EnquiryValues = z.infer<typeof enquirySchema>;

interface EnquiryFormProps {
  email: string;
  defaultSubject?: string;
  defaultMessage?: string;
}

/**
 * The site has no server-side contact endpoint, so the form composes a
 * pre-filled email in the guest's own mail client. Nothing is transmitted
 * or stored by this page, and the interface says so.
 */
export default function EnquiryForm({
  email,
  defaultSubject = 'Reservation enquiry',
  defaultMessage = '',
}: EnquiryFormProps) {
  const [prepared, setPrepared] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnquiryValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { name: '', email: '', subject: defaultSubject, message: defaultMessage },
  });

  function onSubmit(values: EnquiryValues) {
    const body = `Name: ${values.name}\nEmail: ${values.email}\n\n${values.message}`;
    const href = `mailto:${email}?subject=${encodeURIComponent(`[Website] ${values.subject}`)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    setPrepared(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="field-label">Your name</label>
          <input
            id="contact-name"
            autoComplete="name"
            className="field"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p id="contact-name-error" role="alert" className="mt-2 text-[0.8rem] text-[#a8402c]">
              {errors.name.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="contact-email" className="field-label">Email address</label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            className="field"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="contact-email-error" role="alert" className="mt-2 text-[0.8rem] text-[#a8402c]">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="field-label">Subject</label>
        <select id="contact-subject" className="field" {...register('subject')}>
          <option>Reservation enquiry</option>
          <option>Payment method request</option>
          <option>A question about a residence</option>
          <option>Arrival and directions</option>
          <option>Something else</option>
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="field-label">Your message</label>
        <textarea
          id="contact-message"
          rows={5}
          className="field resize-none"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          {...register('message')}
        />
        {errors.message && (
          <p id="contact-message-error" role="alert" className="mt-2 text-[0.8rem] text-[#a8402c]">
            {errors.message.message}
          </p>
        )}
      </div>

      <p className="border-l-2 border-gold-bronze bg-paper-warm px-4 py-3 text-[0.78rem] leading-relaxed text-ink-600">
        This form prepares an email in your own mail app. It does not send or store anything on this website. Please
        never include payment card details in your message.
      </p>

      <div className="flex flex-wrap items-center gap-5">
        <button type="submit" className="btn-gold group">
          Prepare email
          <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
        </button>
        <a href={`mailto:${email}`} className="link-line text-ink-600 hover:text-ink-900">
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          Email directly
        </a>
      </div>

      {prepared && (
        <div role="status" className="flex items-start gap-3 border border-gold-bronze/40 bg-paper-warm px-4 py-4">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden="true" />
          <p className="text-[0.85rem] leading-relaxed text-ink-700">
            Your mail app should now be open with the message ready to send. If nothing opened, use the direct email
            link above.
          </p>
        </div>
      )}
    </form>
  );
}
