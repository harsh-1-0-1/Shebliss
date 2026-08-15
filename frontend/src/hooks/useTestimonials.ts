import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';
import type { Testimonial } from '@/types';

export const useTestimonials = (limit = 6, featuredOnly = false) =>
  useQuery<Testimonial[]>({
    queryKey: ['testimonials', limit, featuredOnly],
    queryFn: () =>
      api
        .get(`/testimonials?limit=${limit}&featured_only=${featuredOnly}`)
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
  });

export const useAdminTestimonials = () =>
  useQuery<Testimonial[]>({
    queryKey: ['admin-testimonials'],
    queryFn: () => api.get('/testimonials/admin').then((r) => r.data),
  });