/**
 * Formats Supabase and general authentication errors into friendly, localized messages
 */
export function formatAuthError(error: unknown, fallbackMessage = 'Произошла ошибка при аутентификации'): string {
  if (!error) return fallbackMessage;

  const rawMessage = error instanceof Error ? error.message : String(error);
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower.includes('wrong password')
  ) {
    return 'Неверный адрес электронной почты или пароль';
  }

  if (lower.includes('user not found') || lower.includes('no user found')) {
    return 'Пользователь с таким email не найден';
  }

  if (
    lower.includes('user already registered') ||
    lower.includes('already exists') ||
    lower.includes('email already in use')
  ) {
    return 'Пользователь с таким email уже зарегистрирован. Пожалуйста, войдите';
  }

  if (
    lower.includes('password should be at least 6') ||
    lower.includes('password must be at least 6') ||
    lower.includes('password is too short')
  ) {
    return 'Пароль должен содержать минимум 6 символов';
  }

  if (
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return 'Слишком много попыток. Пожалуйста, подождите 1–2 минуты и попробуйте снова';
  }

  if (lower.includes('email not confirmed') || lower.includes('unconfirmed')) {
    return 'Email ещё не подтверждён. Проверьте почту или отключите подтверждение в настройках Supabase';
  }

  if (lower.includes('invalid email') || lower.includes('valid email')) {
    return 'Пожалуйста, введите корректный адрес электронной почты';
  }

  if (lower.includes('network') || lower.includes('fetch failed')) {
    return 'Ошибка подключения к серверу. Проверьте интернет-соединение';
  }

  return rawMessage;
}
