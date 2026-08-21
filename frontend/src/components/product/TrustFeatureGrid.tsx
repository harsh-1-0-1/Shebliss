import { TRUST_FEATURES } from '@/lib/trust';

export default function TrustFeatureGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {TRUST_FEATURES.map((item) => (
        <div key={item.label} className="flex items-start gap-2.5 border border-card bg-bone p-3">
          <span className="text-gold shrink-0 mt-0.5">
            <item.icon size={17} strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-espresso leading-tight">{item.label}</p>
            <p className="text-[11px] text-slate mt-0.5">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}