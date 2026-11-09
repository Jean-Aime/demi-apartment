import { AlertCircle, ExternalLink } from 'lucide-react';

type BookingUrlResult =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'ready'; url: URL };

function getBookingUrl(): BookingUrlResult {
  const configuredUrl = import.meta.env.VITE_BEDS24_BOOKING_URL?.trim();
  if (!configuredUrl) return { status: 'missing' };

  try {
    const url = new URL(configuredUrl);
    const isBeds24Host = url.hostname === 'beds24.com' || url.hostname.endsWith('.beds24.com');
    if (url.protocol !== 'https:' || !isBeds24Host) {
      return { status: 'invalid' };
    }
    return { status: 'ready', url };
  } catch {
    return { status: 'invalid' };
  }
}

export default function Beds24BookingWidget() {
  const booking = getBookingUrl();

  if (booking.status === 'missing') return null;

  if (booking.status === 'invalid') {
    return (
      <div className="border-l-2 border-[#C75D4A] bg-paper-warm px-5 py-4 text-sm text-ink-800" role="alert">
        <AlertCircle className="mr-2 inline h-4 w-4 text-[#C75D4A]" aria-hidden="true" />
        The Beds24 booking URL is invalid. Add the secure booking-engine URL from your Beds24 account.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-relaxed text-ink-500">
          Live availability and direct reservations are provided securely by Beds24.
        </p>
        <a
          href={booking.url.toString()}
          target="_blank"
          rel="noreferrer"
          className="link-line text-xs text-ink-900"
        >
          Open booking page
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
      <iframe
        src={booking.url.toString()}
        title="DEMI APARTMENT live availability and booking calendar"
        loading="eager"
        className="h-[min(1000px,110svh)] min-h-[720px] w-full border border-ink-100 bg-paper"
      />
    </div>
  );
}
