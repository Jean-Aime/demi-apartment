import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { overlapsBookedRange, toIsoDate, type BookedRange } from '@/lib/bookings';

interface DateRangeCalendarProps {
  checkIn: string;
  checkOut: string;
  bookedRanges: BookedRange[];
  onChange: (checkIn: string, checkOut: string) => void;
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function addDays(date: Date, count: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

function toMonthLabel(date: Date): string {
  return date.toLocaleDateString('en', { month: 'long', year: 'numeric' });
}

function toDayLabel(date: Date): string {
  return date.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DateRangeCalendar({
  checkIn,
  checkOut,
  bookedRanges,
  onChange,
}: DateRangeCalendarProps) {
  const today = toIsoDate(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(new Date()));
  const checkoutSelection = Boolean(checkIn && !checkOut);
  const months = [visibleMonth, addMonths(visibleMonth, 1)];

  function chooseDate(date: Date) {
    const isoDate = toIsoDate(date);
    if (!checkIn || checkOut || isoDate <= checkIn) {
      onChange(isoDate, '');
      return;
    }
    onChange(checkIn, isoDate);
  }

  function isUnavailable(date: Date): boolean {
    const isoDate = toIsoDate(date);
    if (isoDate < today) return true;

    if (checkoutSelection && isoDate <= checkIn) return false;
    if (checkoutSelection) return overlapsBookedRange(checkIn, isoDate, bookedRanges);

    const nextDate = toIsoDate(addDays(date, 1));
    return overlapsBookedRange(isoDate, nextDate, bookedRanges);
  }

  function dayClass(date: Date, inCurrentMonth: boolean): string {
    const isoDate = toIsoDate(date);
    const selected = isoDate === checkIn || isoDate === checkOut;
    const inRange = Boolean(checkIn && checkOut && isoDate > checkIn && isoDate < checkOut);
    const unavailable = isUnavailable(date);

    return [
      'flex aspect-square items-center justify-center text-sm transition-colors',
      inCurrentMonth ? 'text-ink-800' : 'text-ink-300',
      isoDate === today && !selected ? 'ring-1 ring-inset ring-gold/60' : '',
      selected ? 'bg-ink-900 font-medium text-paper' : '',
      inRange ? 'bg-gold/15 text-ink-900' : '',
      unavailable && inCurrentMonth ? 'cursor-not-allowed text-ink-300 line-through' : '',
      !unavailable && !selected && inCurrentMonth ? 'hover:bg-paper-warm' : '',
    ].filter(Boolean).join(' ');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-500">
          {checkOut
            ? `${toDayLabel(new Date(`${checkIn}T00:00:00`))} — ${toDayLabel(new Date(`${checkOut}T00:00:00`))}`
            : checkIn
              ? `Check-in ${toDayLabel(new Date(`${checkIn}T00:00:00`))} · choose check-out`
              : 'Choose your check-in date'}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous month"
            disabled={toIsoDate(addMonths(visibleMonth, -1)) < toIsoDate(monthStart(new Date()))}
            onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
            className="flex h-10 w-10 items-center justify-center border border-ink-100 text-ink-700 transition-colors hover:border-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
            className="flex h-10 w-10 items-center justify-center border border-ink-100 text-ink-700 transition-colors hover:border-gold"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {months.map((month, monthIndex) => {
          const firstDay = monthStart(month);
          const mondayFirstOffset = (firstDay.getDay() + 6) % 7;
          const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
          const cells = Array.from({ length: Math.ceil((mondayFirstOffset + daysInMonth) / 7) * 7 }, (_, index) => {
            const dayNumber = index - mondayFirstOffset + 1;
            return new Date(month.getFullYear(), month.getMonth(), dayNumber);
          });

          return (
            <div key={toIsoDate(firstDay)} className={monthIndex === 1 ? 'hidden md:block' : ''}>
              <h3 className="mb-4 text-center font-serif text-xl text-ink-900">{toMonthLabel(month)}</h3>
              <div className="grid grid-cols-7 border-b border-ink-100 pb-2 text-center text-[0.65rem] font-medium uppercase tracking-[0.12em] text-ink-400">
                {weekDays.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="mt-2 grid grid-cols-7">
                {cells.map((date, index) => {
                  const inCurrentMonth = date.getMonth() === month.getMonth();
                  const unavailable = !inCurrentMonth || isUnavailable(date);
                  const isoDate = toIsoDate(date);
                  return (
                    <button
                      key={`${isoDate}-${index}`}
                      type="button"
                      aria-label={toDayLabel(date)}
                      aria-pressed={isoDate === checkIn || isoDate === checkOut}
                      disabled={unavailable}
                      onClick={() => chooseDate(date)}
                      className={dayClass(date, inCurrentMonth)}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-ink-100 pt-4 text-xs text-ink-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 border border-ink-900 bg-ink-900" aria-hidden="true" />
          Selected dates
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 bg-ink-100" aria-hidden="true" />
          Unavailable nights
        </span>
      </div>
    </div>
  );
}
