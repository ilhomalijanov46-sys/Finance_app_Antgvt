import i18n from '../i18n/i18n';

/**
 * Formats Supabase/PostgREST errors raised while saving a record into friendly
 * messages. Mirrors formatAuthError, but for data mutations.
 */
interface PostgrestLikeError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export function formatDbError(error: unknown, fallbackKey = 'dbErrors.generic'): string {
  const t = i18n.t.bind(i18n);
  if (!error) return t(fallbackKey);

  const err = (typeof error === 'object' ? error : {}) as PostgrestLikeError;
  const rawMessage = err.message || (error instanceof Error ? error.message : String(error));
  const lower = rawMessage.toLowerCase();

  // The schema migration has not been applied to this Supabase project yet: PGRST204 is
  // a missing column, PGRST205 a missing table ("Could not find the table ... in the
  // schema cache"), 42P01/42703 the same seen from Postgres itself.
  if (
    err.code === 'PGRST204' ||
    err.code === 'PGRST205' ||
    err.code === '42703' ||
    err.code === '42P01' ||
    lower.includes('does not exist') ||
    lower.includes('could not find the table')
  ) {
    return t('dbErrors.missingSchema', { details: rawMessage });
  }

  // RLS rejected the write: the session no longer matches the user_id being saved.
  if (err.code === '42501' || lower.includes('row-level security') || lower.includes('violates row-level')) {
    return t('dbErrors.rls');
  }

  if (err.code === '23503' || lower.includes('foreign key')) {
    return t('dbErrors.foreignKey');
  }

  if (err.code === '23505' || lower.includes('duplicate key')) {
    return t('dbErrors.duplicate');
  }

  if (err.code === '23514' || lower.includes('check constraint')) {
    return t('dbErrors.checkConstraint');
  }

  if (lower.includes('jwt') || lower.includes('token is expired')) {
    return t('dbErrors.jwtExpired');
  }

  if (lower.includes('network') || lower.includes('fetch failed') || lower.includes('failed to fetch')) {
    return t('dbErrors.network');
  }

  return rawMessage || t(fallbackKey);
}
