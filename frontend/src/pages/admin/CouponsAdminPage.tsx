import { useState } from 'react';
import { Tag, Percent, IndianRupee, Plus, Trash2, Loader2, Edit2, X, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useToggleCoupon,
  useDeleteCoupon,
  type Coupon,
} from '@/hooks/useAdmin';

// ── Types ──────────────────────────────────────────────────────────────────

interface CouponFormState {
  code: string;
  type: 'percent' | 'fixed';
  value: string;
  minAmount: string;
  maxDiscount: string;
  usageLimit: string;
  validFrom: string;
  validUntil: string;
}

const EMPTY_FORM: CouponFormState = {
  code: '',
  type: 'percent',
  value: '',
  minAmount: '',
  maxDiscount: '',
  usageLimit: '',
  validFrom: '',
  validUntil: '',
};

function couponToForm(c: Coupon): CouponFormState {
  const toDateInput = (iso: string | null | undefined) => {
    if (!iso) return '';
    // ISO string → "YYYY-MM-DD" for <input type="date">
    return iso.slice(0, 10);
  };
  return {
    code: c.code,
    type: c.discount_type,
    value: String(c.value),
    minAmount: String(c.min_order_amount),
    maxDiscount: c.max_discount_amount != null ? String(c.max_discount_amount) : '',
    usageLimit: c.usage_limit != null ? String(c.usage_limit) : '',
    validFrom: toDateInput(c.valid_from),
    validUntil: toDateInput(c.valid_until),
  };
}

// ── Coupon Form Panel ──────────────────────────────────────────────────────

function CouponFormPanel({
  initial,
  editingId,
  onCancel,
  onSaved,
}: {
  initial: CouponFormState;
  editingId: number | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();

  const [form, setForm] = useState<CouponFormState>(initial);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof CouponFormState, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.value || !form.minAmount) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.type === 'percent' && Number(form.value) > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }
    if (form.validFrom && form.validUntil && form.validFrom > form.validUntil) {
      toast.error('"Valid From" must be before "Valid Until"');
      return;
    }

    setSubmitting(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.type,
      value: Number(form.value),
      min_order_amount: Number(form.minAmount),
      max_discount_amount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usage_limit: form.usageLimit ? Number(form.usageLimit) : null,
      valid_from: form.validFrom ? `${form.validFrom}T00:00:00` : null,
      valid_until: form.validUntil ? `${form.validUntil}T23:59:59` : null,
    };

    try {
      if (editingId !== null) {
        await updateCoupon.mutateAsync({ id: editingId, body: payload });
        toast.success(`Coupon "${payload.code}" updated successfully!`);
      } else {
        await createCoupon.mutateAsync(payload);
        toast.success(`Coupon "${payload.code}" created successfully!`);
      }
      onSaved();
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          'Failed to save coupon',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Modal header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
        <h2 className="text-sm font-bold text-gray-800">
          {editingId !== null ? 'Edit Promo Code' : 'Create Promo Code'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Code */}
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">
            Coupon Code *
          </label>
          <input
            placeholder="e.g. FESTIVE200"
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            required
            className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none uppercase"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Codes are auto-capitalized. No spaces allowed.
          </p>
        </div>

        {/* Discount type toggle */}
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Discount Type</label>
          <div className="flex gap-2 border rounded-lg p-0.5 bg-gray-50 text-xs font-bold text-gray-600">
            <button
              type="button"
              onClick={() => set('type', 'percent')}
              className={`flex-1 py-1 rounded flex items-center justify-center gap-1 transition ${
                form.type === 'percent' ? 'bg-white text-primary shadow-xs' : 'hover:bg-gray-100'
              }`}
            >
              <Percent size={12} /> Percentage
            </button>
            <button
              type="button"
              onClick={() => set('type', 'fixed')}
              className={`flex-1 py-1 rounded flex items-center justify-center gap-1 transition ${
                form.type === 'fixed' ? 'bg-white text-primary shadow-xs' : 'hover:bg-gray-100'
              }`}
            >
              <IndianRupee size={12} /> Fixed Flat
            </button>
          </div>
        </div>

        {/* Value + Min amount */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              {form.type === 'percent' ? 'Percentage (%)' : 'Amount (₹)'} *
            </label>
            <input
              type="number"
              placeholder={form.type === 'percent' ? '15' : '200'}
              value={form.value}
              onChange={(e) => set('value', e.target.value)}
              required
              min={0.01}
              step="any"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Min Order Total (₹) *
            </label>
            <input
              type="number"
              placeholder="999"
              value={form.minAmount}
              onChange={(e) => set('minAmount', e.target.value)}
              required
              min={0}
              step="any"
              className={inputClass}
            />
          </div>
        </div>

        {/* Max discount (only meaningful for percent) + Usage limit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Max Discount (₹)
              {form.type === 'fixed' && (
                <span className="ml-1 text-gray-400 font-normal">(n/a for flat)</span>
              )}
            </label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={form.maxDiscount}
              onChange={(e) => set('maxDiscount', e.target.value)}
              min={0.01}
              step="any"
              disabled={form.type === 'fixed'}
              className={`${inputClass} disabled:opacity-40 disabled:cursor-not-allowed`}
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Caps the max rupee saving for % coupons.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Usage Limit
            </label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={form.usageLimit}
              onChange={(e) => set('usageLimit', e.target.value)}
              min={1}
              className={inputClass}
            />
            <p className="text-[10px] text-gray-400 mt-1">Leave empty for unlimited.</p>
          </div>
        </div>

        {/* Validity dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1 flex items-center gap-1">
              <Calendar size={11} /> Valid From
            </label>
            <input
              type="date"
              value={form.validFrom}
              onChange={(e) => set('validFrom', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1 flex items-center gap-1">
              <Calendar size={11} /> Valid Until
            </label>
            <input
              type="date"
              value={form.validUntil}
              onChange={(e) => set('validUntil', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <p className="text-[10px] text-gray-400 -mt-2">Leave dates empty for a coupon with no expiry.</p>

        {/* Formula preview */}
        <div className="rounded-lg bg-gray-50 border p-3 text-[11px] text-gray-500 leading-normal">
          {form.type === 'percent' ? (
            <p>
              💡 Orders above ₹{form.minAmount || 'X'} get{' '}
              <strong>{form.value || 'Y'}% off</strong>
              {form.maxDiscount ? `, capped at ₹${form.maxDiscount}` : ''}.
            </p>
          ) : (
            <p>
              💡 Orders above ₹{form.minAmount || 'X'} get flat{' '}
              <strong>₹{form.value || 'Y'} off</strong>.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 bg-primary text-white text-xs rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/95 transition disabled:opacity-60"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {editingId !== null ? 'Save Changes' : 'Add Coupon'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CouponsAdminPage() {
  const { data: coupons = [], isLoading } = useCoupons();
  const toggleCoupon = useToggleCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const openCreate = () => {
    setEditingCoupon(null);
    setFormOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingCoupon(null);
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleCoupon.mutateAsync(id);
      toast.success('Coupon visibility toggled');
    } catch {
      toast.error('Failed to toggle coupon');
    }
  };

  const handleDelete = (id: number, codeStr: string) => {
    if (confirm(`Are you sure you want to delete coupon code "${codeStr}"?`)) {
      deleteCoupon.mutate(id, {
        onSuccess: () => toast.success('Coupon code deleted'),
        onError: () => toast.error('Failed to delete coupon'),
      });
    }
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5">

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Generate coupon codes, configure reductions, and incentivize orders.
          </p>
        </div>
        {!formOpen && (
          <button
            onClick={openCreate}
            className="px-4 py-2.5 bg-primary text-white text-sm rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary/95 transition shrink-0"
          >
            <Plus size={16} /> Create Coupon
          </button>
        )}
      </div>

      {/* Explanatory banner */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 leading-normal">
        <div className="flex gap-2">
          <div className="bg-primary/10 w-9 h-9 rounded-lg flex items-center justify-center text-primary shrink-0">
            <Percent size={18} />
          </div>
          <div>
            <span className="font-bold text-primary">Percentage Discount (%)</span>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Deducts a slice off the total bill. E.g. <strong>15% OFF</strong> on ₹1,000 saves ₹150. Use Max Discount to cap the saving.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-primary/10 w-9 h-9 rounded-lg flex items-center justify-center text-primary shrink-0">
            <IndianRupee size={18} />
          </div>
          <div>
            <span className="font-bold text-primary">Fixed Flat Discount (₹)</span>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Deducts a precise flat amount. E.g. <strong>₹200 OFF</strong> reduces a ₹1,500 order to ₹1,300.
            </p>
          </div>
        </div>
      </div>

      {/* Create / Edit form (inline, slides in above table) */}
      {formOpen && (
        <CouponFormPanel
          initial={editingCoupon ? couponToForm(editingCoupon) : EMPTY_FORM}
          editingId={editingCoupon?.id ?? null}
          onCancel={closeForm}
          onSaved={closeForm}
        />
      )}

      {/* Coupon Registry Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">Coupons Ledger</h2>
          <span className="text-xs text-gray-400">{coupons.length} total</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No coupons created yet. Click "Create Coupon" above to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b text-gray-500 bg-gray-50/50">
                  <th className="p-3 font-semibold">Code</th>
                  <th className="p-3 font-semibold">Discount</th>
                  <th className="p-3 font-semibold">Min Order</th>
                  <th className="p-3 font-semibold">Max Saving</th>
                  <th className="p-3 font-semibold text-center">Usage</th>
                  <th className="p-3 font-semibold">Validity</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                  <th className="p-3 font-semibold text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c: Coupon) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/50">
                    <td className="p-3 font-bold text-gray-900">
                      <span className="flex items-center gap-1.5">
                        <Tag size={13} className="text-primary-light shrink-0" />
                        {c.code}
                      </span>
                    </td>
                    <td className="p-3 font-medium">
                      {c.discount_type === 'percent' ? `${c.value}% Off` : `₹${c.value} Flat`}
                    </td>
                    <td className="p-3 text-gray-600">₹{c.min_order_amount}</td>
                    <td className="p-3 text-gray-600">
                      {c.max_discount_amount != null ? `₹${c.max_discount_amount}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="p-3 text-center font-bold text-primary">
                      {c.times_used}{c.usage_limit ? ` / ${c.usage_limit}` : ''} uses
                    </td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">
                      {c.valid_from || c.valid_until ? (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="shrink-0" />
                          {formatDate(c.valid_from) ?? '∞'} → {formatDate(c.valid_until) ?? '∞'}
                        </span>
                      ) : (
                        <span className="text-gray-300">No expiry</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggle(c.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          c.is_active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-blue-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          title="Edit coupon"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Delete coupon"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
