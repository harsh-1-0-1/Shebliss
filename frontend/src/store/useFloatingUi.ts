import { create } from 'zustand';

// Coordinates the mobile bottom-right floating elements so they never overlap:
//   - BottomNav            bottom 0, full width, always (non-admin, non-checkout)
//   - PDP sticky CTA bar   bottom-[64px], md:hidden, /products/:slug only
//   - WhatsApp bubble      offsets above whichever bars are present
interface FloatingUiState {
  isPdpBarVisible: boolean;
  setPdpBarVisible: (visible: boolean) => void;
  reset: () => void;
}

export const useFloatingUi = create<FloatingUiState>((set) => ({
  isPdpBarVisible: false,
  setPdpBarVisible: (visible) => set({ isPdpBarVisible: visible }),
  reset: () => set({ isPdpBarVisible: false }),
}));

// Mobile bottom offset for the WhatsApp bubble:
//   76px  → only BottomNav below
//   130px → the PDP CTA bar is also present above BottomNav
export function useWhatsAppBottomClass() {
  const isPdpBarVisible = useFloatingUi((s) => s.isPdpBarVisible);
  return isPdpBarVisible ? 'bottom-[130px]' : 'bottom-[76px]';
}