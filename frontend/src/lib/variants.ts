import type { VariantGroup } from '@/types';

// Full cartesian product of variant groups → combo rows (cap guards pathological products,
// matching the admin combos table cap). Each row carries the per-group option map so
// visibility/auto-select can be computed without re-walking the matrix.
export function buildComboRows(
  groups: VariantGroup[],
  cap = 50,
): { key: string; groupOption: Record<string, string> }[] {
  let rows: { key: string; groupOption: Record<string, string> }[] = [{ key: '', groupOption: {} }];
  outer: for (const group of groups) {
    const options = group?.options ?? [];
    const next: { key: string; groupOption: Record<string, string> }[] = [];
    for (const row of rows) {
      for (const opt of options) {
        if (next.length >= cap) break outer;
        next.push({
          key: row.key ? `${row.key}__${opt.id}` : opt.id,
          groupOption: { ...row.groupOption, [group.id]: opt.id },
        });
      }
    }
    rows = next;
  }
  return rows;
}