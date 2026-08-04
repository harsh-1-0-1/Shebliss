import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Currency {
  code: string;
  symbol: string;
  label: string;
  rate: number; // multiplier relative to INR (base)
}

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee', rate: 1 },
  { code: 'USD', symbol: '$', label: 'US Dollar', rate: 0.012 },
  { code: 'EUR', symbol: '€', label: 'Euro', rate: 0.011 },
  { code: 'GBP', symbol: '£', label: 'British Pound', rate: 0.0095 },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham', rate: 0.044 },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar', rate: 0.016 },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar', rate: 0.016 },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', rate: 0.018 },
];

interface CurrencyState {
  selected: Currency;
  setCurrency: (code: string) => void;
  format: (amountInr: number) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      selected: CURRENCIES[0], // INR default

      setCurrency: (code) => {
        const currency = CURRENCIES.find((c) => c.code === code);
        if (currency) set({ selected: currency });
      },

      format: (amountInr) => {
        const { selected } = get();
        const converted = amountInr * selected.rate;
        // Show 0 decimals for INR, 2 for others
        const formatted =
          selected.code === 'INR'
            ? Math.round(converted).toLocaleString('en-IN')
            : converted.toFixed(2);
        return `${selected.symbol}${formatted}`;
      },
    }),
    {
      name: 'shebliss-currency',
      partialize: (state) => ({ selected: state.selected }),
    },
  ),
);
