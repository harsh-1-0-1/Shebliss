const TRUST_ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
    label: '18k Gold Plated',
    sub: 'Lasting lustre',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z" />
      </svg>
    ),
    label: 'Anti-Tarnish',
    sub: 'Guaranteed finish',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M12 2a6 6 0 0 1 6 6c0 4-6 14-6 14S6 12 6 8a6 6 0 0 1 6-6z" />
        <circle cx="12" cy="8" r="2" />
      </svg>
    ),
    label: 'Hypoallergenic',
    sub: 'Safe for all skin',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" />
        <path d="M7 10c.5-3 5.5-3 6 0 .5 4-6 4-6 8h6" />
      </svg>
    ),
    label: 'Water Resistant',
    sub: 'Sweat & splash proof',
  },
];

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
