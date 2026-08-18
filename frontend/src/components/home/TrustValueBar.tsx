import { TRUST_ITEMS } from '@/lib/trust';

export default function TrustValueBar() {
  return (
    <section className="w-full border-y border-[#EFECE6]" style={{ backgroundColor: '#F9F8F6' }}>
      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-6 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
          {TRUST_ITEMS.map((item) => (
            <div key={item.label} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="shrink-0 text-[#C6A15E]">{item.icon}</div>
              <div>
                <p
                  className="text-[13px] text-[#1A1A1A] leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, letterSpacing: '0.03em' }}
                >
                  {item.label}
                </p>
                <p className="text-[10px] text-[#767676] mt-0.5 tracking-wide font-body">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}