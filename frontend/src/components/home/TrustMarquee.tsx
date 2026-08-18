import { TRUST_MARQUEE_MESSAGES } from '@/lib/trust';

const Separator = () => (
  <span className="mx-6 text-bone/40 text-[9px] select-none" aria-hidden>✦</span>
);

export default function TrustMarquee() {
  const strip = TRUST_MARQUEE_MESSAGES.map((msg, i) => (
    <span key={i} className="inline-flex items-center whitespace-nowrap">
      {i > 0 && <Separator />}
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-bone">{msg}</span>
    </span>
  ));

  return (
    <div className="w-full border-y border-card bg-forest overflow-hidden py-3.5">
      <div className="animate-marquee flex items-center whitespace-nowrap">
        {strip}
        <Separator />
        {strip}
      </div>
    </div>
  );
}