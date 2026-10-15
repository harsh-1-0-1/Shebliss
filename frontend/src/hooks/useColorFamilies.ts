import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ColorFamily {
  slug: string;
  label: string;
  hex: string;
}

/**
 * Fetches active color families from the backend.
 * Data is sourced from COLOR_FAMILIES in backend/app/core/color_families.py —
 * not hardcoded in the frontend.
 */
export function useColorFamilies() {
  return useQuery<ColorFamily[]>({
    queryKey: ['color-families'],
    queryFn: async () => {
      const { data } = await api.get<ColorFamily[]>('/color-families');
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 min — color families change rarely
    placeholderData: [],
  });
}
