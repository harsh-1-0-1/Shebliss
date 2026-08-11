import { Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { APP_NAME } from '@/lib/branding';

export default function MaintenancePage() {
  const { openAuthModal } = useAuthStore();

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center p-6 text-center select-none"
      style={{ backgroundColor: '#F9F8F6' }}
    >
      <div className="max-w-md w-full flex flex-col items-center animate-fade-in">
        {/* Branding Wordmark */}
        <p className="text-[12px] font-bold tracking-[0.3em] uppercase text-[#C6A15E] mb-6">
          {APP_NAME}
        </p>

        {/* Heading */}
        <h1
          className="text-4xl sm:text-5xl text-[#1A1A1A] leading-tight mb-4"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 400,
            letterSpacing: '0.02em',
          }}
        >
          We'll Be Right Back
        </h1>

        {/* Divider */}
        <div className="w-12 h-[1px] bg-[#C6A15E]/40 my-6" />

        {/* Message */}
        <p className="text-[14px] text-[#767676] leading-relaxed font-body max-w-sm">
          The storefront is currently offline for scheduled updates or temporary maintenance.
          We apologize for the inconvenience and will be back shortly.
        </p>
      </div>

      {/* Admin Access Link */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <button
          onClick={openAuthModal}
          className="group flex items-center gap-2 text-[11px] text-[#767676] hover:text-[#1A1A1A] transition-colors uppercase tracking-[0.15em] font-medium"
        >
          <Lock size={12} className="text-[#C6A15E] group-hover:scale-110 transition-transform" />
          Admin Access
        </button>
      </div>
    </div>
  );
}
