import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/common/PageLoader';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatAuthError } from '../utils/authErrors';

/**
 * Reached only via the link in the reset email. Supabase (detectSessionInUrl: true,
 * see services/supabase.ts) parses the recovery token out of the URL fragment and
 * establishes a real session before this component mounts, firing a PASSWORD_RECOVERY
 * event the global AuthContext also observes. This route is deliberately NOT wrapped
 * by ProtectedRoute/PublicRoute in App.tsx — either wrapper would bounce the visitor
 * away before they get a chance to set the new password.
 */
export const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (!cancelled) setCheckingSession(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setHasSession(Boolean(data?.session));
        setCheckingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError(t('auth.errors.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err: unknown) {
      console.error('Password update error:', err);
      setError(formatAuthError(err, 'auth.errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  let content: React.ReactNode;

  if (checkingSession) {
    content = <PageLoader showLabel={false} />;
  } else if (done) {
    content = (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <h2 className="text-sm font-semibold">{t('auth.resetPasswordSuccessTitle')}</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          {t('auth.resetPasswordSuccessDesc')}
        </p>
        <Button
          type="button"
          variant="primary"
          className="w-full h-11 text-xs font-semibold tracking-wide"
          onClick={() => navigate('/')}
        >
          {t('auth.continueToApp')}
        </Button>
      </div>
    );
  } else if (!hasSession) {
    content = (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6 text-rose-500" />
        </div>
        <h2 className="text-sm font-semibold">{t('auth.invalidResetLinkTitle')}</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          {t('auth.invalidResetLinkDesc')}
        </p>
        <Link
          to="/forgot-password"
          className="inline-block text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          {t('auth.requestNewLink')}
        </Link>
      </div>
    );
  } else {
    content = (
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-sm font-semibold">{t('auth.resetPasswordTitle')}</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400">{t('auth.resetPasswordDesc')}</p>

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
          label={t('auth.newPassword')}
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          required
          helperText={t('auth.passwordHint')}
          autoFocus
        />

        <Input
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.passwordPlaceholder')}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError('');
          }}
          required
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full h-11 text-xs font-semibold tracking-wide"
          isLoading={submitting}
        >
          {t('auth.resetPasswordAction')}
        </Button>
      </form>
    );
  }

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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-apple-md shadow-blue-500/25">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('auth.title')}</h1>
        </div>

        <Card variant="glass" padding="lg" className="shadow-apple-lg">
          {content}
        </Card>
      </motion.div>
    </div>
  );
};
