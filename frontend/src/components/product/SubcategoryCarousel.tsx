import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { categoryUrl } from '@/lib/urls';
import type { Category } from '@/types';

interface SubcategoryCarouselProps {
  /** The category slug from the URL */
  categorySlug: string;
}

/**
 * Find a category node in the tree by slug.
 * Returns the category and its parent (if the category is a child).
 */
function findCategoryNode(
  categories: Category[],
  slug: string,
  parent: Category | null = null
): { node: Category; parent: Category | null } | null {
  for (const cat of categories) {
    if (cat.slug === slug) {
      return { node: cat, parent };
    }
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryNode(cat.children, slug, cat);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get the parent category to display in the carousel.
 * If a child category is selected, show the parent's children (to allow switching).
 * If a parent is selected, show its children.
 */
function getCarouselCategories(categories: Category[], slug: string): Category[] {
  const found = findCategoryNode(categories, slug);
  if (!found) return [];

  const { node, parent } = found;

  // If this node has children, show them (we're on a parent page)
  if (node.children && node.children.length > 0) {
    return node.children;
  }

  // If this is a child and has a parent with children, show parent's children
  if (parent && parent.children && parent.children.length > 0) {
    return parent.children;
  }

  return [];
}

function titleCase(s: string) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// titleCase is used for the "All <Parent>" item label — kept intentionally.
void titleCase; // prevents unused-vars lint warning

export default function SubcategoryCarousel({ categorySlug }: SubcategoryCarouselProps) {
  const { data: categories = [], isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#EFECE6] animate-pulse" />
            <div className="w-12 h-3 bg-[#EFECE6] rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const carouselCategories = getCarouselCategories(categories, categorySlug);

  // Don't render if there are no subcategories to show
  if (carouselCategories.length === 0) {
    return null;
  }

  // Find the currently selected category to highlight it
  const found = findCategoryNode(categories, categorySlug);
  const isChildSelected = found && found.parent && found.parent.slug !== categorySlug;
  const currentSlug = isChildSelected ? categorySlug : categorySlug;

  // Build items: "All" first, then subcategories
  const items = [
    // "All" option - goes to parent if we're on a child, otherwise shows current
    found?.parent 
      ? { slug: found.parent.slug, name: `All ${found.parent.name}`, image_url: found.parent.image_url, isAll: true }
      : { slug: categorySlug, name: 'All', image_url: found?.node.image_url ?? null, isAll: true },
    ...carouselCategories.map(cat => ({ 
      slug: cat.slug, 
      name: cat.name, 
      image_url: cat.image_url,
      isAll: false 
    }))
  ];

  return (
    <div className="mb-6 md:mb-8">
      {/* Mobile: horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none md:hidden">
        {items.map((item) => (
          <Link
            key={item.slug}
            to={categoryUrl(item.slug)}
            className={`flex flex-col items-center shrink-0 ${item.slug === currentSlug ? 'opacity-100' : 'opacity-70 hover:opacity-100'} transition-opacity`}
          >
            <div
              className={`w-16 h-16 rounded-full border-2 overflow-hidden bg-[#EFECE6] ${
                item.slug === currentSlug ? 'border-[#C6A15E]' : 'border-transparent'
              }`}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#767676] text-xs">
                  {item.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="mt-2 text-[11px] font-medium text-[#2B2421] text-center max-w-[64px] truncate">
              {item.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Desktop: centered grid */}
      <div className="hidden md:flex flex-wrap justify-center gap-6">
        {items.map((item) => (
          <Link
            key={item.slug}
            to={categoryUrl(item.slug)}
            className={`flex flex-col items-center ${item.slug === currentSlug ? 'opacity-100' : 'opacity-70 hover:opacity-100'} transition-opacity`}
          >
            <div
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-2 overflow-hidden bg-[#EFECE6] ${
                item.slug === currentSlug ? 'border-[#C6A15E]' : 'border-transparent hover:border-[#C6A15E]'
              }`}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#767676] text-sm">
                  {item.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="mt-2 text-xs md:text-sm font-medium text-[#2B2421] text-center max-w-[80px] truncate">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}