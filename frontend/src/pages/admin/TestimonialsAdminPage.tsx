import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Star, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { Testimonial } from '@/types';
import Spinner from '@/components/ui/Spinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

function TestimonialForm({
  testimonialId,
  onClose,
  onSuccess,
}: {
  testimonialId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: testimonial, isLoading: isLoadingTestimonial } = useQuery<Testimonial>({
    queryKey: ['admin-testimonial', testimonialId],
    queryFn: async () => {
      const { data } = await api.get('/testimonials/admin');
      return data.find((t: Testimonial) => t.id === testimonialId);
    },
    enabled: !!testimonialId,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const fd = new FormData();

    fd.append('name', (formData.get('name') as string) || '');
    fd.append('quote', (formData.get('quote') as string) || '');
    fd.append('rating', (formData.get('rating') as string) || '5');
    fd.append('sort_order', (formData.get('sort_order') as string) || '0');

    const item_purchased = formData.get('item_purchased') as string;
    if (item_purchased) fd.append('item_purchased', item_purchased);

    const location = formData.get('location') as string;
    if (location) fd.append('location', location);

    fd.append('is_verified', formData.get('is_verified') === 'on' ? 'true' : 'false');
    fd.append('is_featured', formData.get('is_featured') === 'on' ? 'true' : 'false');
    fd.append('is_active', formData.get('is_active') === 'on' ? 'true' : 'false');

    if (avatarFile) fd.append('avatar', avatarFile);

    try {
      if (testimonialId) {
        await api.put(`/testimonials/admin/${testimonialId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Testimonial updated');
      } else {
        await api.post('/testimonials/admin', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Testimonial created');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          'Failed to save testimonial',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (testimonialId && isLoadingTestimonial) return <div className="p-12"><Spinner /></div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border">
      <h2 className="text-lg font-bold mb-6">
        {testimonialId ? 'Edit Testimonial' : 'New Testimonial'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
          <input
            type="text"
            name="name"
            defaultValue={testimonial?.name || ''}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="e.g. Ananya Sharma"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Review *</label>
          <textarea
            name="quote"
            defaultValue={testimonial?.quote || ''}
            required
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="What did they love about the piece?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
            <input
              type="number"
              name="rating"
              defaultValue={testimonial?.rating ?? 5}
              min={1}
              max={5}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              type="number"
              name="sort_order"
              defaultValue={testimonial?.sort_order ?? 0}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Purchased (Optional)</label>
            <input
              type="text"
              name="item_purchased"
              defaultValue={testimonial?.item_purchased || ''}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="e.g. Kundan Choker"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
            <input
              type="text"
              name="location"
              defaultValue={testimonial?.location || ''}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="e.g. Mumbai"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Avatar (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
          {testimonial?.avatar_url && !avatarFile && (
            <div className="mt-2">
              <img src={testimonial.avatar_url} alt="avatar" className="h-14 w-14 rounded-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_verified"
              defaultChecked={testimonial ? testimonial.is_verified : true}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm">Verified</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={testimonial ? testimonial.is_featured : true}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={testimonial ? testimonial.is_active : true}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm">Active</span>
          </label>
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Testimonial'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function TestimonialsAdminPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const { data } = await api.get('/testimonials/admin');
      return data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
    queryClient.invalidateQueries({ queryKey: ['testimonials'] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/testimonials/admin/${id}`);
    },
    onSuccess: () => {
      toast.success('Testimonial deleted');
      invalidate();
    },
    onError: (err: unknown) => {
      toast.error(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          'Failed to delete testimonial',
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/testimonials/admin/${id}/toggle`);
    },
    onSuccess: () => {
      toast.success('Testimonial status updated');
      invalidate();
    },
    onError: (err: unknown) => {
      toast.error(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          'Failed to update testimonial',
      );
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
    setIsFormOpen(true);
  };

  return (
    <ErrorBoundary>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Testimonials Management</h1>
          <button
            onClick={() => {
              setEditingId(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-semibold"
          >
            <Plus size={16} /> Add Testimonial
          </button>
        </div>

        {isFormOpen ? (
          <TestimonialForm
            testimonialId={editingId}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              invalidate();
            }}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-12"><Spinner /></div>
              ) : testimonials && testimonials.length > 0 ? (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Order</th>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Rating</th>
                      <th className="px-6 py-4 font-medium">Review</th>
                      <th className="px-6 py-4 font-medium">Purchased</th>
                      <th className="px-6 py-4 font-medium">Featured</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {testimonials.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium">{t.sort_order}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {t.avatar_url && (
                              <img
                                src={t.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover bg-gray-100"
                              />
                            )}
                            <span>
                              <span className="block">{t.name}</span>
                              {t.location && <span className="block text-xs text-gray-400">{t.location}</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Star size={12} fill="currentColor" /> {t.rating}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="truncate max-w-[240px] block" title={t.quote}>
                            {t.quote}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="truncate max-w-[160px] block text-gray-500">
                            {t.item_purchased || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {t.is_featured ? (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                              Featured
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleMutation.mutate(t.id)}
                            title="Click to toggle"
                            className={t.is_active
                              ? 'inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full hover:bg-green-100'
                              : 'inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full hover:bg-gray-200'}
                          >
                            {t.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            {t.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(t.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  No testimonials found. Add your first testimonial to get started.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}