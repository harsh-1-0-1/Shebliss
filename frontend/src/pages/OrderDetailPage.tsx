import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { useOrder } from '@/hooks/useOrders';
import { useCurrencyStore } from '@/store/currencyStore';
import Spinner from '@/components/ui/Spinner';
import { formatSelectedOptions } from '@/lib/variantDisplay';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  paid:    { bg: '#F0FDF4', text: '#15803D' },
  pending: { bg: '#FEF9EC', text: '#B07B0A' },
  failed:  { bg: '#FEF2F2', text: '#DC2626' },
};

function paymentLabel(method: string, status: string) {
  if (method === 'cod') return status === 'paid' ? 'COD Collected' : 'Cash on Delivery';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useOrder(Number(id));
  const { format } = useCurrencyStore();

  if (isLoading) return <Spinner className="py-32" />;
  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4" style={{ backgroundColor: '#F9F8F6' }}>
        <p className="font-display text-xl text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Order not found</p>
        <Link to="/orders" className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#C6A15E] hover:underline">Back to Orders</Link>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const pmStyle = STATUS_STYLE[order.payment_status] ?? { bg: '#EFECE6', text: '#767676' };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-5" style={{ backgroundColor: '#F9F8F6' }}>
      <Link to="/orders"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-[0.14em] uppercase text-[#767676] hover:text-[#1A1A1A] transition-colors">
        <ArrowLeft size={12} /> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EFECE6]">
        <div>
          <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-[#C6A15E] mb-1">Order</p>
          <h1 className="text-2xl sm:text-3xl text-[#1A1A1A]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>
            #{order.id}
          </h1>
          <p className="text-[13px] text-[#767676] font-body mt-1">
            Placed {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="sm:text-right space-y-1.5">
          <p className="text-[1.6rem] font-bold text-[#1A1A1A] font-body">{format(order.total_amount)}</p>
          <span className="inline-block px-3 py-1 text-[11px] font-bold tracking-wider uppercase font-body"
            style={{ backgroundColor: pmStyle.bg, color: pmStyle.text }}>
            Payment: {paymentLabel(order.payment_method, order.payment_status)}
          </span>
        </div>
      </div>

      {/* Status timeline */}
      {!isCancelled && (
        <div className="p-5 sm:p-6 border border-[#EFECE6]" style={{ backgroundColor: '#EFECE6' }}>
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#767676] mb-5">Order Status</p>
          <div className="flex items-start">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex-1 flex flex-col items-center relative">
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`absolute top-3 left-1/2 w-full h-[1px] ${i < currentStep ? 'bg-[#C6A15E]' : 'bg-[#EFECE6]'}`}
                    style={{ backgroundColor: i < currentStep ? '#C6A15E' : '#D5D0C8' }} />
                )}
                <div className={`relative z-10 w-6 h-6 flex items-center justify-center text-[11px] font-bold border-2 ${
                  i <= currentStep ? 'bg-[#1A1A1A] border-[#1A1A1A] text-[#F9F8F6]' : 'bg-[#F9F8F6] border-[#EFECE6] text-[#767676]'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] mt-2 capitalize text-center font-body font-semibold tracking-wide ${
                  i <= currentStep ? 'text-[#1A1A1A]' : 'text-[#767676]'
                }`}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="p-5 border border-red-200 text-center" style={{ backgroundColor: '#FEF2F2' }}>
          <p className="text-red-600 font-semibold text-[14px] font-body">This order has been cancelled.</p>
        </div>
      )}

      {/* Items */}
      <div className="border border-[#EFECE6]" style={{ backgroundColor: '#EFECE6' }}>
        <div className="px-5 py-4 border-b border-[#F9F8F6] flex items-center gap-2">
          <Package size={15} strokeWidth={1.5} className="text-[#C6A15E]" />
          <span className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#1A1A1A]">
            Items ({order.items.length})
          </span>
        </div>
        <div className="divide-y divide-[#F9F8F6]">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              {item.resolved_image_url && (
                <img src={item.resolved_image_url} alt="" className="w-14 h-14 object-cover shrink-0" style={{ backgroundColor: '#F9F8F6' }} loading="lazy" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#1A1A1A] font-body">{item.product_name || `Product #${item.product_id}`}</p>
                {item.selected_options && (
                  <p className="text-[12px] text-[#767676] font-body mt-0.5">{formatSelectedOptions(item.selected_options, null)}</p>
                )}
                <p className="text-[12px] text-[#767676] font-body mt-0.5">Qty: {item.quantity} × {format(item.unit_price)}</p>
              </div>
              <p className="text-[15px] font-bold text-[#1A1A1A] shrink-0 font-body">{format(item.quantity * item.unit_price)}</p>
            </div>
          ))}
        </div>
      </div>

      {order.payment_id && (
        <p className="text-[12px] text-[#767676] font-body px-1">
          Payment reference: <span className="font-mono text-[#1A1A1A] break-all">{order.payment_id}</span>
        </p>
      )}

      {(order.discount_amount ?? 0) > 0 && (
        <div className="border border-[#EFECE6] px-5 py-4 space-y-1.5 text-[13px] font-body" style={{ backgroundColor: '#EFECE6' }}>
          <div className="flex justify-between text-[#767676]"><span>Subtotal</span><span>{format(order.subtotal ?? order.total_amount + (order.discount_amount ?? 0))}</span></div>
          <div className="flex justify-between text-[#0E7A3D]">
            <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
            <span>-{format(order.discount_amount ?? 0)}</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-[#F9F8F6] font-bold text-[#1A1A1A]"><span>Total</span><span>{format(order.total_amount)}</span></div>
        </div>
      )}
    </div>
  );
}
