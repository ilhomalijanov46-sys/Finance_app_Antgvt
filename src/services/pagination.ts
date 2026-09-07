/**
 * Supabase's Data API caps every response at the project's "Max rows" setting (1000 by
 * default) and gives no sign that it truncated the result — no error, no flag. A read
 * of `.select('*')` on an account with more than a thousand transactions therefore used
 * to come back quietly short, and every total, chart and CSV export downstream was
 * computed from that fragment. Worse, `dataService.importBackup` de-duplicates against
 * these same reads, so a truncated list made a repeat import insert duplicates.
 *
 * Reading page by page until a short page comes back is the fix: a short page is the
 * only reliable "that was the end" signal PostgREST gives.
 */
const PAGE_SIZE = 1000;

export async function fetchAllPages<T>(
  label: string,
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const all: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);

    if (error) {
      // Rethrow: a failed read must reach the UI as an error, not as "no records".
      console.error(`Failed to fetch ${label} from Supabase:`, error);
      throw error;
    }

    const rows = data || [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) return all;
  }
}
