import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { AlertCircle, MailCheck } from 'lucide-react';
import { AppLogo } from '../components/common/AppLogo';
import { motion } from 'framer-motion';
import { formatAuthError } from '../utils/authErrors';

export const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t('auth.errors.enterEmail'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err: unknown) {
      console.error('Password reset request error:', err);
      // Do not reveal whether the address exists: same UI either way. If the request
      // itself failed for a different reason (not configured, rate limit), still show
      // that — the "email exists or not" ambiguity only applies to Supabase's own
      // response, not to our own request failing outright.
      setError(formatAuthError(err, 'auth.errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center p-4 bg-[#fbfbfd] dark:bg-[#000000] text-slate-900 dark:text-zinc-100 relative selection:bg-blue-500/20">
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <AppLogo size={56} className="w-14 h-14 mx-auto shadow-apple-md shadow-blue-500/25 rounded-[15px]" />
          <h1 className="text-2xl font-bold tracking-tight">{t('auth.title')}</h1>
        </div>

        <Card variant="glass" padding="lg" className="shadow-apple-lg">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto">
                <MailCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-sm font-semibold">{t('auth.resetEmailSentTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                {t('auth.resetEmailSentDesc', { email: email.trim() })}
              </p>
              <Link
                to="/login"
                className="inline-block text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-sm font-semibold">{t('auth.forgotPasswordTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {t('auth.forgotPasswordDesc')}
              </p>

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-fade-in font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label={t('auth.email')}
                type="email"
                autoComplete="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                required
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11 text-xs font-semibold tracking-wide"
                isLoading={submitting}
              >
                {t('auth.sendResetLink')}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  {t('auth.backToLogin')}
                </Link>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
