import i18n from '../i18n/i18n';

/**
 * Maps a Supabase auth error onto one of the `auth.errors.*` messages, so the text the
 * user reads follows the interface language instead of being pinned to Russian.
 */
export function formatAuthError(error: unknown, fallbackKey = 'auth.errors.generic'): string {
  const t = i18n.t.bind(i18n);
  if (!error) return t(fallbackKey);

  const rawMessage = error instanceof Error ? error.message : String(error);
  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower.includes('wrong password')
  ) {
    return t('auth.errors.signInFailed');
  }

  if (lower.includes('user not found') || lower.includes('no user found')) {
    return t('auth.errors.userNotFound');
  }

  if (
    lower.includes('user already registered') ||
    lower.includes('already exists') ||
    lower.includes('email already in use')
  ) {
    return t('auth.errors.userAlreadyRegistered');
  }

  if (
    lower.includes('password should be at least 6') ||
    lower.includes('password must be at least 6') ||
    lower.includes('password is too short')
  ) {
    return t('auth.errors.passwordTooShort');
  }

  if (
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return t('auth.errors.rateLimit');
  }

  if (lower.includes('email not confirmed') || lower.includes('unconfirmed')) {
    return t('auth.errors.emailNotConfirmed');
  }

  if (lower.includes('invalid email') || lower.includes('valid email')) {
    return t('auth.errors.invalidEmail');
  }

  if (lower.includes('network') || lower.includes('fetch failed') || lower.includes('failed to fetch')) {
    return t('auth.errors.network');
  }

  // A message we do not recognise is still more useful to the user than a generic one.
  return rawMessage || t(fallbackKey);
}
