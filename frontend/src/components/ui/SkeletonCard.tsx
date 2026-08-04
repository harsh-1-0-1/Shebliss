export default function SkeletonCard() {
  return (
    <div className="flex flex-col gap-0" aria-hidden="true">
      {/* Image placeholder — 3:4 ratio */}
      <div className="skeleton-bone w-full" style={{ aspectRatio: '3/4' }} />
      {/* Text placeholders */}
      <div className="pt-3 space-y-2">
        <div className="skeleton-bone h-2 w-1/2 rounded" />
        <div className="skeleton-bone h-4 w-4/5 rounded" />
        <div className="skeleton-bone h-4 w-3/5 rounded" />
        <div className="skeleton-bone h-3 w-1/3 rounded mt-1" />
      </div>
    </div>
  );
}
