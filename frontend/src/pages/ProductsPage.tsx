import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import ProductCard from '@/components/product/ProductCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'discount', label: 'Best Discount' },
];

const PRICE_RANGES = [
  { label: 'Under ₹500', min: '', max: '500' },
  { label: '₹500 – ₹1,000', min: '500', max: '1000' },
  { label: '₹1,000 – ₹2,500', min: '1000', max: '2500' },
  { label: '₹2,500+', min: '2500', max: '' },
];

const MATERIAL_TAGS = [
  { label: '18k Gold Plated', tag: '18k-gold' },
  { label: 'Rhodium / Silver', tag: 'rhodium' },
  { label: 'Kundan', tag: 'kundan' },
  { label: 'Polki', tag: 'polki' },
  { label: 'Antique', tag: 'antique' },
  { label: 'Temple', tag: 'temple' },
];

function titleCase(s: string) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface FilterProps {
  selectedCategory: string;
  onCategory: (s: string) => void;
  minPrice: string;
  maxPrice: string;
  onMinPrice: (v: string) => void;
  onMaxPrice: (v: string) => void;
  selectedTags: string[];
  onTagToggle: (t: string) => void;
  inStock: boolean;
  onInStock: (v: boolean) => void;
  onReset: () => void;
}

function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-[#EFECE6]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3.5 text-[11px] font-bold tracking-[0.16em] uppercase text-[#1A1A1A] hover:text-[#C6A15E] transition-colors"
      >
        {title}
        <ChevronDown size={13} className={`transition-transform duration-200 text-[#767676] ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function FiltersSidebar({
  selectedCategory, onCategory,
  minPrice, maxPrice, onMinPrice, onMaxPrice,
  selectedTags, onTagToggle,
  inStock, onInStock,
  onReset,
}: FilterProps) {
  const { data: categories } = useCategories();
  const allCats = categories?.flatMap((c) => [c, ...(c.children ?? [])]) ?? [];

  // Active price range bucket
  const activePriceRange = PRICE_RANGES.find(
    (r) => r.min === minPrice && r.max === maxPrice,
  );

  function selectPriceRange(r: typeof PRICE_RANGES[number]) {
    if (activePriceRange?.label === r.label) {
      onMinPrice(''); onMaxPrice('');
    } else {
      onMinPrice(r.min); onMaxPrice(r.max);
    }
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between py-3 border-b border-[#EFECE6]">
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A]">Filters</span>
        <button onClick={onReset} className="text-[10px] font-semibold text-[#767676] hover:text-[#C6A15E] transition-colors uppercase tracking-wider">Clear all</button>
      </div>

      <AccordionSection title="Price Range">
        <div className="space-y-1.5">
          {PRICE_RANGES.map((r) => (
            <button key={r.label} onClick={() => selectPriceRange(r)}
              className={`w-full text-left text-[12px] px-3 py-2 transition-colors ${activePriceRange?.label === r.label ? 'bg-[#1A1A1A] text-[#F9F8F6]' : 'text-[#2B2421] hover:bg-[#EFECE6]'}`}
            >
              {r.label}
            </button>
          ))}
          <div className="flex gap-2 mt-2">
            <input type="number" placeholder="Min" value={minPrice} onChange={(e) => onMinPrice(e.target.value)}
              className="w-full px-2.5 py-2 text-[12px] border border-[#EFECE6] focus:outline-none focus:border-[#C6A15E] bg-white transition-colors" />
            <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => onMaxPrice(e.target.value)}
              className="w-full px-2.5 py-2 text-[12px] border border-[#EFECE6] focus:outline-none focus:border-[#C6A15E] bg-white transition-colors" />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Category">
        <div className="space-y-0.5 max-h-56 overflow-y-auto scrollbar-none">
          <button onClick={() => onCategory('')}
            className={`block w-full text-left text-[12px] px-3 py-2 transition-colors ${!selectedCategory ? 'bg-[#1A1A1A] text-[#F9F8F6]' : 'text-[#2B2421] hover:bg-[#EFECE6]'}`}
          >
            All Jewellery
          </button>
          {allCats.map((c) => (
            <button key={c.slug} onClick={() => onCategory(c.slug)}
              className={`block w-full text-left text-[12px] px-3 py-2 transition-colors ${selectedCategory === c.slug ? 'bg-[#1A1A1A] text-[#F9F8F6]' : 'text-[#2B2421] hover:bg-[#EFECE6]'}`}
            >
              {c.parent_id ? <span className="pl-3">{c.name}</span> : c.name}
            </button>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Material / Finish">
        <div className="space-y-1.5">
          {MATERIAL_TAGS.map((m) => {
            const active = selectedTags.includes(m.tag);
            return (
              <label key={m.tag} className="flex items-center gap-2.5 cursor-pointer group">
                <span
                  onClick={() => onTagToggle(m.tag)}
                  className={`w-4 h-4 shrink-0 border flex items-center justify-center transition-colors cursor-pointer ${active ? 'bg-[#1A1A1A] border-[#1A1A1A]' : 'border-[#EFECE6] group-hover:border-[#C6A15E]'}`}
                >
                  {active && <span className="text-[#F9F8F6] text-[10px]">✓</span>}
                </span>
                <span onClick={() => onTagToggle(m.tag)} className="text-[12px] text-[#2B2421] group-hover:text-[#1A1A1A] transition-colors">{m.label}</span>
              </label>
            );
          })}
        </div>
      </AccordionSection>

      <AccordionSection title="Availability">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <span
            onClick={() => onInStock(!inStock)}
            className={`w-4 h-4 shrink-0 border flex items-center justify-center transition-colors cursor-pointer ${inStock ? 'bg-[#1A1A1A] border-[#1A1A1A]' : 'border-[#EFECE6] group-hover:border-[#C6A15E]'}`}
          >
            {inStock && <span className="text-[#F9F8F6] text-[10px]">✓</span>}
          </span>
          <span className="text-[12px] text-[#2B2421]">In Stock Only</span>
        </label>
      </AccordionSection>
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [inStock, setInStock] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(mobileFiltersOpen);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort_by') || '';
  const page = Number(searchParams.get('page')) || 1;
  const tagParam = searchParams.get('tags') || searchParams.get('tag') || '';
  const selectedTags = useMemo(() => tagParam.split(',').filter(Boolean), [tagParam]);

  function updateParams(updates: Record<string, string>) {
    const p = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    p.delete('page');
    setSearchParams(p);
  }

  function setPage(n: number) {
    const p = new URLSearchParams(searchParams);
    n > 1 ? p.set('page', String(n)) : p.delete('page');
    setSearchParams(p);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleTagToggle(tag: string) {
    const next = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
    updateParams({ tags: next.join(',') });
  }

  function resetFilters() {
    setMinPrice(''); setMaxPrice(''); setInStock(false);
    setSearchParams({});
  }

  // Sync price inputs to URL
  useEffect(() => { updateParams({ min_price: minPrice }); }, [minPrice]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { updateParams({ max_price: maxPrice }); }, [maxPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = useProducts({
    category_slug: category || undefined,
    search: search || undefined,
    sort_by: sort || undefined,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    tags: selectedTags.length ? selectedTags.join(',') : undefined,
    page,
    limit: 24,
  });

  const hasFilters = !!(category || minPrice || maxPrice || selectedTags.length || inStock);
  const pageTitle = search ? `Results for "${search}"` : category ? titleCase(category) : selectedTags.length === 1 ? titleCase(selectedTags[0]) : 'All Jewellery';

  const filterProps: FilterProps = {
    selectedCategory: category,
    onCategory: (s) => updateParams({ category: s }),
    minPrice, maxPrice,
    onMinPrice: setMinPrice,
    onMaxPrice: setMaxPrice,
    selectedTags, onTagToggle: handleTagToggle,
    inStock, onInStock: setInStock,
    onReset: resetFilters,
  };

  const items = data?.items ?? [];

  return (
    <div ref={topRef} style={{ backgroundColor: '#F9F8F6' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-6 sm:py-10">

        {/* Page header */}
        <div className="mb-6 sm:mb-8">
          <p className="text-[9px] font-bold tracking-[0.28em] uppercase text-[#C6A15E] mb-1">Collection</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <h1
              className="text-3xl sm:text-4xl text-[#1A1A1A] leading-none"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.03em' }}
            >
              {pageTitle}
            </h1>
            <p className="text-[12px] text-[#767676] font-body shrink-0">
              {data ? `Showing ${(page - 1) * 24 + 1}–${Math.min(page * 24, data.total)} of ${data.total} results` : ''}
            </p>
          </div>
        </div>

        {/* Mobile control bar */}
        <div className="lg:hidden flex items-center gap-3 mb-5 pb-4 border-b border-[#EFECE6]">
          <button onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#1A1A1A] text-[11px] font-bold tracking-[0.12em] uppercase text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors"
          >
            <SlidersHorizontal size={14} />
            Filter
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#C6A15E]" />}
          </button>
          <div className="relative flex-1">
            <select value={sort} onChange={(e) => updateParams({ sort_by: e.target.value })}
              className="w-full appearance-none border border-[#EFECE6] bg-white text-[12px] font-medium text-[#2B2421] py-2.5 pl-3 pr-8 focus:outline-none focus:border-[#C6A15E] transition-colors"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#767676] pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-8 lg:gap-10">
          {/* Desktop sidebar — sticky with scroll containment */}
          <aside className="hidden lg:block w-[220px] xl:w-[250px] shrink-0">
            <div
              className="sticky overflow-y-auto scrollbar-none"
              style={{ top: '100px', maxHeight: 'calc(100vh - 120px)' }}
            >
              <FiltersSidebar {...filterProps} />
            </div>
          </aside>

          {/* Product grid area */}
          <div className="flex-1 min-w-0">
            {/* Desktop sort row */}
            <div className="hidden lg:flex items-center justify-end mb-5 pb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#767676] uppercase tracking-wider font-body">Sort by</span>
                <div className="relative">
                  <select value={sort} onChange={(e) => updateParams({ sort_by: e.target.value })}
                    className="appearance-none border border-[#EFECE6] bg-white text-[12px] font-medium text-[#2B2421] py-2 pl-3 pr-7 focus:outline-none focus:border-[#C6A15E] transition-colors"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#767676] pointer-events-none" />
                </div>
              </div>
            </div>

            <ErrorBoundary>
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                  {Array.from({ length: 15 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                  <p className="font-display text-2xl text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>No results found</p>
                  <p className="text-[13px] text-[#767676]">Try adjusting your filters or explore a different category.</p>
                  <button onClick={resetFilters} className="mt-2 px-6 py-2.5 border border-[#1A1A1A] text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#1A1A1A] hover:text-[#F9F8F6] transition-colors">
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </ErrorBoundary>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-12">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                  className="w-9 h-9 flex items-center justify-center border border-[#EFECE6] text-[#767676] hover:border-[#1A1A1A] hover:text-[#1A1A1A] disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: data.pages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === data.pages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center gap-1.5">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-[#EFECE6] text-sm">…</span>}
                      <button onClick={() => setPage(p)}
                        className={`w-9 h-9 text-[12px] font-semibold border transition-colors ${p === page ? 'bg-[#1A1A1A] text-[#F9F8F6] border-[#1A1A1A]' : 'border-[#EFECE6] text-[#767676] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'}`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}
                  className="w-9 h-9 flex items-center justify-center border border-[#EFECE6] text-[#767676] hover:border-[#1A1A1A] hover:text-[#1A1A1A] disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter bottom drawer */}
      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#F9F8F6] max-h-[88vh] flex flex-col lg:hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFECE6] shrink-0">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#1A1A1A] flex items-center gap-2">
                <SlidersHorizontal size={14} /> Filters
              </span>
              <button onClick={() => setMobileFiltersOpen(false)} className="w-8 h-8 flex items-center justify-center text-[#767676] hover:text-[#1A1A1A]">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <FiltersSidebar {...filterProps} />
            </div>
            <div className="shrink-0 px-5 py-4 border-t border-[#EFECE6] safe-bottom">
              <button onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3.5 bg-[#1A1A1A] text-[#F9F8F6] text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#2B2421] transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
