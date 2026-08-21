import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package, ArrowRight } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import Spinner from '@/components/ui/Spinner';
import { useCurrencyStore } from '@/store/currencyStore';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: '#FEF9EC', text: '#B07B0A', label: 'Pending' },
  confirmed: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Confirmed' },
  shipped:   { bg: '#F3F0FF', text: '#6D28D9', label: 'Shipped' },
  delivered: { bg: '#F0FDF4', text: '#15803D', label: 'Delivered' },
  cancelled: { bg: '#FEF2F2', text: '#DC2626', label: 'Cancelled' },
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders(page);
  const { format } = useCurrencyStore();

  if (isLoading) return <Spinner className="py-32" />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ backgroundColor: '#F9F8F6' }}>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-[#C6A15E] mb-1">Account</p>
        <h1 className="text-3xl sm:text-4xl text-[#1A1A1A] leading-none"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.02em' }}>
          My Orders
        </h1>
      </div>

      {!data?.items.length ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-14 h-14 border border-[#EFECE6] flex items-center justify-center">
            <Package size={22} strokeWidth={1.5} className="text-[#C6A15E]" />
          </div>
          <p className="font-display text-xl text-[#1A1A1A]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            No orders yet
          </p>
          <p className="text-[14px] text-[#767676] font-body">Your completed orders will appear here.</p>
          <Link to="/products"
            className="px-8 py-3 bg-[#1A1A1A] text-[#F9F8F6] text-[12px] font-bold tracking-[0.16em] uppercase hover:bg-[#2B2421] transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((order) => {
            const s = STATUS_STYLE[order.status] ?? { bg: '#EFECE6', text: '#767676', label: order.status };
            return (
              <Link key={order.id} to={`/orders/${order.id}`}
                className="flex items-center justify-between gap-4 p-4 sm:p-5 border border-[#EFECE6] hover:border-[#C6A15E] transition-colors group"
                style={{ backgroundColor: '#EFECE6' }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 border border-[#F9F8F6] flex items-center justify-center" style={{ backgroundColor: '#F9F8F6' }}>
                    <Package size={16} strokeWidth={1.5} className="text-[#C6A15E]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1A1A1A] font-body">Order #{order.id}</p>
                    <p className="text-[12px] text-[#767676] font-body mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {' · '}{order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                      style={{ backgroundColor: s.bg, color: s.text }}>
                      {s.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-[16px] font-bold text-[#1A1A1A] font-body">{format(order.total_amount)}</p>
                  <ArrowRight size={14} className="text-[#767676] group-hover:text-[#C6A15E] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="w-9 h-9 flex items-center justify-center border border-[#EFECE6] text-[#767676] hover:border-[#1A1A1A] disabled:opacity-30 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-[13px] text-[#767676] font-body px-2">Page {page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}
            className="w-9 h-9 flex items-center justify-center border border-[#EFECE6] text-[#767676] hover:border-[#1A1A1A] disabled:opacity-30 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
