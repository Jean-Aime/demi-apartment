import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface AdminModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'md' | 'xl';
}

export default function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
  size = 'md',
}: AdminModalProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    headingRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }

      if (event.key === 'Tab') {
        const dialog = headingRef.current?.closest('[role="dialog"]');
        const focusable = dialog?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        aria-describedby={description ? 'admin-modal-description' : undefined}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden bg-paper shadow-[0_24px_100px_rgba(14,13,11,0.3)] sm:max-h-[88vh] ${
          size === 'xl' ? 'max-w-5xl' : 'max-w-xl'
        }`}
      >
        <header className="flex items-start justify-between gap-5 border-b border-ink-100 px-5 py-4 sm:px-7">
          <div>
            <h2 ref={headingRef} id="admin-modal-title" tabIndex={-1} className="font-serif text-2xl text-ink-900 outline-none sm:text-3xl">
              {title}
            </h2>
            {description && <p id="admin-modal-description" className="mt-1 text-sm text-ink-500">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="flex h-10 w-10 shrink-0 items-center justify-center border border-ink-100 text-ink-600 transition-colors hover:border-gold hover:text-gold">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto p-5 sm:p-7">{children}</div>
      </section>
    </div>
  );
}
