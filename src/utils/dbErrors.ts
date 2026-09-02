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

export function formatDbError(error: unknown, fallbackMessage = 'Не удалось сохранить запись'): string {
  if (!error) return fallbackMessage;

  const err = (typeof error === 'object' ? error : {}) as PostgrestLikeError;
  const rawMessage = err.message || (error instanceof Error ? error.message : String(error));
  const lower = rawMessage.toLowerCase();

  // The table is missing a column the app writes — the schema migration has not
  // been applied to this Supabase project yet.
  if (err.code === 'PGRST204' || err.code === '42703' || lower.includes('does not exist')) {
    return `В базе данных нет нужной колонки (${rawMessage}). Примените миграции из supabase/migrations в SQL-редакторе Supabase`;
  }

  // RLS rejected the write: the session no longer matches the user_id being saved.
  if (err.code === '42501' || lower.includes('row-level security') || lower.includes('violates row-level')) {
    return 'Нет прав на запись. Войдите в аккаунт заново и попробуйте ещё раз';
  }

  if (err.code === '23503' || lower.includes('foreign key')) {
    return 'Профиль пользователя не найден в базе. Войдите заново, чтобы он создался';
  }

  if (err.code === '23505' || lower.includes('duplicate key')) {
    return 'Такая запись уже существует';
  }

  if (err.code === '23514' || lower.includes('check constraint')) {
    return 'Введённые данные не прошли проверку. Проверьте сумму и категорию';
  }

  if (lower.includes('jwt') || lower.includes('token is expired')) {
    return 'Сессия истекла. Войдите в аккаунт заново';
  }

  if (lower.includes('network') || lower.includes('fetch failed') || lower.includes('failed to fetch')) {
    return 'Ошибка подключения к серверу. Проверьте интернет-соединение';
  }

  return rawMessage || fallbackMessage;
}
