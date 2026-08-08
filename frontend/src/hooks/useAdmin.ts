import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface AdminStats {
  total_products: number;
  total_orders: number;
  total_users: number;
  revenue_today: number;
  revenue_month: number;
  orders_by_status: Record<string, number>;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<AdminStats>('/admin/stats');
      return data;
    },  });
}

export function useAdminOrders(status?: string, page = 1) {
  return useQuery({
    queryKey: ['admin', 'orders', status, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page };
      if (status) params.status = status;
      const { data } = await api.get('/admin/orders', { params });
      return data;
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data } = await api.put(`/admin/orders/${id}/status`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export function useAdminUsers(page = 1) {
  return useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: async () => {
      const { data } = await api.get('/admin/users', { params: { page } });
      return data;
    },
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: { is_active?: boolean; is_admin?: boolean } }) => {
      const { data } = await api.patch(`/admin/users/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export interface CorporateInquiry {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  company_name: string;
  customisation?: string | null;
  qty_requested?: number | null;
  status: 'new' | 'review' | 'quoted' | 'approved' | 'cancelled';
  created_at: string;
}

export function useCorporateInquiries(status?: string, page = 1) {
  return useQuery({
    queryKey: ['admin', 'corporate-inquiries', status, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page };
      if (status) params.status = status;
      const { data } = await api.get('/corporate-inquiries/admin', { params });
      return data;
    },
  });
}

export function useUpdateInquiryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data } = await api.patch(`/corporate-inquiries/admin/${id}/status`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'corporate-inquiries'] }),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['categories-admin'] });
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      parent_id?: number | null;
      image_url?: string | null;
    }) => {
      const { data } = await api.post('/categories', body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['categories-admin'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: {
        name?: string;
        parent_id?: number | null;
        image_url?: string | null;
        is_active?: boolean;
        sort_order?: number;
      };
    }) => {
      const { data } = await api.put(`/categories/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['categories-admin'] });
    },
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/blog', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog'] }),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      slug,
      body,
    }: {
      slug: string;
      body: {
        title: string;
        excerpt: string;
        content: string;
        category: string;
        author_name: string;
        is_published: boolean;
      };
    }) => {
      const { data } = await api.put(`/blog/${slug}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog'] });
    },
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      await api.delete(`/blog/${slug}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog'] }),
  });
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  value: number;
  min_order_amount: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  times_used: number;
  is_active: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  created_at: string;
}

export function useCoupons() {
  return useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: async () => {
      const { data } = await api.get<Coupon[]>('/admin/coupons');
      return data;
    },
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      code: string;
      discount_type: 'percent' | 'fixed';
      value: number;
      min_order_amount: number;
      max_discount_amount?: number | null;
      usage_limit?: number | null;
      is_active?: boolean;
      valid_from?: string | null;
      valid_until?: string | null;
    }) => {
      const { data } = await api.post('/admin/coupons', body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: Partial<{
        code: string;
        discount_type: 'percent' | 'fixed';
        value: number;
        min_order_amount: number;
        max_discount_amount: number | null;
        usage_limit: number | null;
        is_active: boolean;
        valid_from: string | null;
        valid_until: string | null;
      }>;
    }) => {
      const { data } = await api.put(`/admin/coupons/${id}`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/coupons/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
}

export function useToggleCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch(`/admin/coupons/${id}/toggle`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
}
