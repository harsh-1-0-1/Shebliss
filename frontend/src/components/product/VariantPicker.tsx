import { buildComboRows } from '@/lib/variants';
import type { VariantGroup, VariantOption } from '@/types';

interface VariantPickerProps {
  groups: VariantGroup[];
  /** Per-combination stock, keyed by combo_key (option IDs joined by "__"). Null when absent. */
  stockMap: Record<string, number> | null;
  selectedOptions: Record<string, string>;
  /** Receives the full next selection (replacement object), never a partial update. */
  onSelect: (next: Record<string, string>) => void;
}

/**
 * Smart per-group variant picker: renders colour swatches, image cards, or pill chips
 * depending on the group. Handles per-combination stock visibility and the
 * "always_show_options" stale-selection guard. Presentational — the consumer owns
 * the selectedOptions state and applies the replacement selection via onSelect.
 */
export default function VariantPicker({ groups, stockMap, selectedOptions, onSelect }: VariantPickerProps) {
  // Combo rows (with per-group option maps + stock) — used for per-combo visibility.
  const comboRows = buildComboRows(groups).map((row) => ({
    ...row,
    stock: Number(stockMap?.[row.key] ?? 0),
  }));

  // Option visibility: an option is visible if some combo row containing it — consistent
  // with the other groups' current selections — has stock > 0. Recomputed on every render.
  // Groups flagged `always_show_options` always render every defined option regardless of
  // stock (e.g. Small/Medium/Large always visible).
  function isOptionVisible(group: VariantGroup, opt: VariantOption): boolean {
    if (group.always_show_options) return true;
    if (!stockMap) return true;
    return comboRows.some((row) => {
      if (row.groupOption[group.id] !== opt.id) return false;
      if (row.stock <= 0) return false;
      for (const g of groups) {
        if (g.id === group.id) continue;
        const sel = selectedOptions[g.id];
        if (sel && row.groupOption[g.id] !== sel) return false;
      }
      return true;
    });
  }

  function selectOption(groupId: string, optionId: string) {
    const clickedGroup = groups.find((g) => g.id === groupId);

    // Stale-selection guard for always-show groups: a picked option (e.g. a size) may
    // have no in-stock combo with the currently-selected options in other groups.
    // Re-derive those groups from the first in-stock combo that preserves as many of
    // the current picks as possible. If nothing is in stock for this pick at all, keep
    // the plain selection and let the consumer's stock check show "Out of Stock" honestly.
    if (clickedGroup?.always_show_options && stockMap) {
      const candidates = comboRows.filter(
        (row) =>
          row.groupOption[groupId] === optionId &&
          Number(stockMap[row.key] ?? 0) > 0,
      );
      if (candidates.length > 0) {
        let best = candidates[0];
        let bestScore = -1;
        for (const row of candidates) {
          let score = 0;
          for (const g of groups) {
            if (g.id === groupId) continue;
            const sel = selectedOptions[g.id];
            if (sel && row.groupOption[g.id] === sel) score++;
          }
          // Strict > over comboRows' cartesian (admin-defined) order → tie-break is
          // "first in defined order", matching auto-select and the admin combos table.
          if (score > bestScore) {
            bestScore = score;
            best = row;
          }
        }
        onSelect(best.groupOption);
        return;
      }
    }

    onSelect({ ...selectedOptions, [groupId]: optionId });
  }

  return (
    <div className="space-y-4">
      {/* Always-show groups (e.g. Select Size) render on top of colours/pots,
          regardless of their admin-defined order. Stable sort preserves relative
          order within each bucket; combo keys keep using variantGroups order. */}
      {[...groups]
        .sort((a, b) => Number(Boolean(b.always_show_options)) - Number(Boolean(a.always_show_options)))
        .map((group) => {
          const isColourGroup = /colou?r/i.test(group.label);
          // Only options with at least one in-stock combo — consistent with the other
          // groups' current selections — are rendered.
          const visibleOptions = (group.options ?? []).filter((o) => isOptionVisible(group, o));
          const hasOptionImages = visibleOptions.some((o) => o.images?.[0]);
          // Render mode: colour → circular swatches; has images → image cards; else → pill chips
          const renderMode: 'colour' | 'image-card' | 'pill' =
            isColourGroup ? 'colour' : hasOptionImages ? 'image-card' : 'pill';

          // Group has no purchasable options — hide it entirely.
          if (visibleOptions.length === 0) return null;

          return (
            <div key={group.id}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {group.label}
              </p>

              {/* ── Colour swatches ─────────────────────────────── */}
              {renderMode === 'colour' && (
                <div className="flex flex-wrap gap-2.5">
                  {visibleOptions.map((opt) => {
                    const isSelected = selectedOptions[group.id] === opt.id;
                    const hex: string = opt.color_hex || '';
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => selectOption(group.id, opt.id)}
                        title={opt.name}
                        aria-label={opt.name}
                        className={`relative h-9 w-9 rounded-full border-2 transition focus:outline-none
                          ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary/40'}
                          cursor-pointer
                        `}
                        style={{ backgroundColor: hex || '#e5e7eb' }}
                      />
                    );
                  })}
                </div>
              )}

              {/* ── Image cards (pot type, style, etc.) ─────────── */}
              {renderMode === 'image-card' && (
                <div className="flex flex-wrap gap-2">
                  {visibleOptions.map((opt) => {
                    const isSelected = selectedOptions[group.id] === opt.id;
                    const priceDelta = Number(opt.price ?? 0);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => selectOption(group.id, opt.id)}
                        className={`relative flex flex-col items-center rounded-xl border-2 p-2 w-[88px] transition focus:outline-none
                          ${isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-gray-200 hover:border-primary/60 bg-white cursor-pointer'
                          }`}
                      >
                        <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-50 mb-1.5 shrink-0">
                          {opt.images?.[0] ? (
                            <img
                              src={opt.images[0]}
                              alt={opt.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-300">
                              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="M21 15l-5-5L5 21"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className={`text-[11px] font-semibold text-center leading-tight line-clamp-2 ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
                          {opt.name}
                        </span>
                        {priceDelta > 0 && (
                          <span className={`text-[10px] mt-0.5 font-medium ${isSelected ? 'text-primary/80' : 'text-gray-400'}`}>
                            +₹{priceDelta}
                          </span>
                        )}
                        {priceDelta === 0 && (
                          <span className={`text-[10px] mt-0.5 font-medium ${isSelected ? 'text-primary/80' : 'text-gray-400'}`}>
                            Included
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Pill chips (size, weight, etc.) ─────────────── */}
              {renderMode === 'pill' && (
                <div className="flex flex-wrap gap-2">
                  {visibleOptions.map((opt) => {
                    const isSelected = selectedOptions[group.id] === opt.id;
                    const priceDelta = Number(opt.price ?? 0);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => selectOption(group.id, opt.id)}
                        className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition focus:outline-none
                          ${isSelected
                            ? 'bg-primary border-primary text-white shadow-sm'
                            : 'border-gray-200 text-gray-700 hover:border-primary hover:text-primary bg-white'
                          }`}
                      >
                        {opt.name}
                        {priceDelta > 0 && (
                          <span className={`ml-1.5 text-xs font-normal ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                            +₹{priceDelta}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}