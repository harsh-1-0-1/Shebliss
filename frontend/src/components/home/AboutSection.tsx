import { Link } from 'react-router-dom';

const SERIF = "'Playfair Display', Georgia, serif";

const A = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="font-semibold hover:opacity-80 transition-opacity"
    style={{
      color: '#a34a2f',
      textDecoration: 'underline',
      textDecorationColor: '#c97b63',
      textUnderlineOffset: '3px',
    }}
  >
    {children}
  </Link>
);

const STATS = [
  { number: '50K+', label: 'Happy Customers' },
  { number: '1M+', label: 'Pieces Adorned' },
  { number: '500+', label: 'Cities Served' },
];

const PILLS = [
  '⭐ 4.8 Rated on Google',
  '🚚 Fast Delivery',
  '↩ Easy Returns',
  '🔒 Secure Payments',
];

function FiligreeCorner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M30 4c4.6 0 6.4 6 11 8s8.6 1.4 10 6-5.4 5.8-5 10.5 3 7.4 3.4 12 3.6 6 1 10-6.4.6-10 3-2.8 8.6-7.4 8.6-4.6-6.2-9-8-8-1.4-9.4-6 5.4-5.8 5-10.5-3-7.4-3.4-12-3.6-6-1-10 6.4-.6 10-3 2.8-8.6 7.4-8.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="30" cy="30" r="3" fill="currentColor" />
      <circle cx="30" cy="12" r="1.6" fill="currentColor" />
      <circle cx="30" cy="48" r="1.6" fill="currentColor" />
      <circle cx="12" cy="30" r="1.6" fill="currentColor" />
      <circle cx="48" cy="30" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default function AboutSection() {
  return (
    <section
      id="about-us"
      className="w-full border-t-4 relative overflow-hidden"
      style={{
        backgroundColor: '#f8f4ec',
        borderTopColor: '#c97b63',
      }}
    >
      <FiligreeCorner className="absolute -top-6 -left-6 w-40 h-40 text-primary/10 pointer-events-none hidden md:block" />
      <FiligreeCorner className="absolute -bottom-6 -right-6 w-40 h-40 text-secondary/10 rotate-180 pointer-events-none hidden md:block" />

      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-14 sm:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-start">

          {/* Left column */}
          <div className="relative">
            <div className="relative">
              <h2
                className="text-[32px] sm:text-[48px] font-bold leading-[1.1] mb-5"
                style={{ fontFamily: SERIF, color: '#0e4d3a' }}
              >
                Adorn Yourself,<br />Adorn Your Story.
              </h2>

              {/* Accent bar */}
              <div
                className="mb-6"
                style={{
                  width: '4px',
                  height: '48px',
                  backgroundColor: '#c97b63',
                  display: 'inline-block',
                  borderRadius: '2px',
                }}
              />

              {/* Stats row */}
              <div className="flex items-start gap-0">
                {STATS.map((stat, i) => (
                  <div key={stat.label} className="flex items-start">
                    {i > 0 && (
                      <div className="w-px h-12 bg-gray-300 mx-4 sm:mx-6 mt-1 shrink-0" />
                    )}
                    <div>
                      <p
                        className="text-[28px] sm:text-[32px] font-bold leading-none"
                        style={{ color: '#0e4d3a' }}
                      >
                        {stat.number}
                      </p>
                      <p className="text-[13px] text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            <p
              className="leading-[1.85] mb-6"
              style={{ fontSize: '17px', color: '#2C2C2A' }}
            >
              Shebliss brings the romance of traditional Indian craftsmanship to
              modern, everyday wear. From{' '}
              <A to="/products?category=earrings">kundan jhumkas</A> and{' '}
              <A to="/products?category=chokers">temple chokers</A> to{' '}
              <A to="/products?category=bridal-sets">complete bridal sets</A>,
              every piece is crafted with care — heirloom in feeling, joyful in
              price. Artificial materials, timeless artistry, delivered right to
              your doorstep.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {PILLS.map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center px-4 py-2 text-[13px] rounded-full"
                  style={{
                    border: '1.5px solid #c97b63',
                    color: '#a34a2f',
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
