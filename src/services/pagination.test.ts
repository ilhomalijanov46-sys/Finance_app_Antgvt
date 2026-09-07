import { describe, it, expect, vi } from 'vitest';
import { fetchAllPages } from './pagination';

describe('fetchAllPages', () => {
  it('keeps reading until a short page comes back', async () => {
    // The bug this exists for: Supabase caps a response at "Max rows" (1000 by default)
    // and says nothing about it, so a single request silently returned a fragment of a
    // large account and every total computed from it was wrong.
    const rows = Array.from({ length: 2300 }, (_, i) => ({ id: i }));
    const ranges: Array<[number, number]> = [];

    const result = await fetchAllPages<{ id: number }>('incomes', (from, to) => {
      ranges.push([from, to]);
      return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
    });

    expect(result).toHaveLength(2300);
    expect(result[2299].id).toBe(2299);
    expect(ranges).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it('stops after one request when the first page is short', async () => {
    const page = vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null });
    await expect(fetchAllPages('goals', page)).resolves.toHaveLength(1);
    expect(page).toHaveBeenCalledTimes(1);
  });

  it('makes exactly one more request when the total is an exact multiple of the page size', async () => {
    // 1000 rows look identical to "there may be more" — the only way to know is to ask
    // again and get an empty page back.
    const rows = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
    const page = vi.fn((from: number, to: number) =>
      Promise.resolve({ data: rows.slice(from, to + 1), error: null })
    );

    await expect(fetchAllPages('expenses', page)).resolves.toHaveLength(1000);
    expect(page).toHaveBeenCalledTimes(2);
  });

  it('rethrows a read failure instead of returning a partial list', async () => {
    const page = vi
      .fn()
      .mockResolvedValueOnce({ data: Array.from({ length: 1000 }, (_, i) => ({ id: i })), error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

    await expect(fetchAllPages('expenses', page)).rejects.toEqual({ message: 'boom' });
  });
});
