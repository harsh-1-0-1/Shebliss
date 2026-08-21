import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCurrencyStore, CURRENCIES } from '@/store/currencyStore';

interface Props {
  /** compact: show just symbol+code, e.g. "₹ INR"; full: show full label */
  variant?: 'compact' | 'full';
  className?: string;
}

export default function CurrencySwitcher({ variant = 'compact', className = '' }: Props) {
  const { selected, setCurrency } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-[#F9F8F6]/80 hover:text-[#F9F8F6] transition-colors py-1 px-2 rounded"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {variant === 'compact' ? (
          <span>{selected.symbol} {selected.code}</span>
        ) : (
          <span>{selected.label}</span>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full mt-1 right-0 z-50 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl py-1 w-48 animate-dropdown"
        >
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              role="option"
              aria-selected={c.code === selected.code}
              onClick={() => { setCurrency(c.code); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                c.code === selected.code
                  ? 'text-[#C6A15E] font-semibold'
                  : 'text-[#F9F8F6]/70 hover:text-[#F9F8F6] hover:bg-white/5'
              }`}
            >
              <span>{c.symbol} {c.code}</span>
              <span className="text-[11px] opacity-60">{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
