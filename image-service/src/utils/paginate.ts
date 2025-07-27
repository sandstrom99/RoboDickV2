export function getPagination(
  page = '1',
  limit = '10'
): { start: number; limit: number } {
  const p = Math.max(parseInt(page, 10), 1);
  const l = Math.max(parseInt(limit, 10), 1);
  return { start: (p - 1) * l, limit: l };
}
