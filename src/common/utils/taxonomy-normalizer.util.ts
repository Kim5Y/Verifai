export function normalizeTaxonomyValue(value: string): string {
  if (typeof value !== 'string') return '';

  let normalized = value.trim();
  if (!normalized) return '';

  normalized = normalized.replace(/^[a-z]{2,3}:/i, '');

  normalized = normalized
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

export function normalizeTaxonomyArray(values?: string[] | null): string[] {
  if (!Array.isArray(values) || values.length === 0) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (typeof value !== 'string') continue;

    const normalized = normalizeTaxonomyValue(value);
    if (!normalized) continue;

    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}
