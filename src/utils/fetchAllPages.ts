export const PAGE_SIZE = 10;

const TOTAL_KEYS = ["Total elements", "Total Elements", "Total Element", "total element", "totalElements", "Total", "total"];

export const readTotal = (data: any): number | undefined => {
  if (!data || typeof data !== "object") return undefined;
  for (const key of TOTAL_KEYS) {
    const v = data[key];
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  return undefined;
};

export const getTotalFromResponse = (res: any): number | undefined =>
  readTotal(res?.data?.data ?? res?.data);

export interface PageResult<T> {
  list: T[];
  total?: number;
}

const PARALLEL_PAGES = 5;
const MAX_PAGES = 500;

export async function fetchAllPages<T>(
  fetchPage: (page: number, size: number) => Promise<PageResult<T>>,
  size: number = PAGE_SIZE
): Promise<T[]> {
  const first = await fetchPage(0, size);
  const all: T[] = [...first.list];
  if (first.list.length !== size) return all;

  const total = first.total;
  if (total !== undefined && total > all.length) {
    const lastPage = Math.min(Math.ceil(total / size) - 1, MAX_PAGES);
    const pages: number[] = [];
    for (let p = 1; p <= lastPage; p++) pages.push(p);
    for (let i = 0; i < pages.length; i += PARALLEL_PAGES) {
      const chunk = pages.slice(i, i + PARALLEL_PAGES);
      const results = await Promise.all(chunk.map((p) => fetchPage(p, size)));
      results.forEach((r) => all.push(...r.list));
    }
    return all;
  }
  if (total !== undefined && total <= all.length) return all;

  for (let p = 1; p <= MAX_PAGES; p++) {
    const r = await fetchPage(p, size);
    all.push(...r.list);
    if (r.list.length < size) break;
  }
  return all;
}