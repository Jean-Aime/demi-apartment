export const PENDING_LABEL = 'To be confirmed';

interface SpecItemProps {
  label: string;
  value: string | undefined;
}

export default function SpecItem({ label, value }: SpecItemProps) {
  return (
    <div>
      <dt className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-ink-400">{label}</dt>
      <dd className={`mt-2 text-sm ${value ? 'text-ink-800' : 'italic text-ink-400'}`}>{value ?? PENDING_LABEL}</dd>
    </div>
  );
}
