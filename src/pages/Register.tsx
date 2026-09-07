import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { ShieldCheck, AlertCircle, MailCheck } from 'lucide-react';
import { AppLogo } from '../components/common/AppLogo';
import { motion } from 'framer-motion';
import { formatAuthError } from '../utils/authErrors';

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t('auth.errors.enterName'));
      return;
    }
    if (!email.trim()) {
      setError(t('auth.errors.enterEmail'));
      return;
    }
    if (!password) {
      setError(t('auth.errors.enterPassword'));
      return;
    }
    if (password.length < 6) {
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
      const { needsEmailConfirmation } = await signUp(email.trim(), password, name.trim());
      if (needsEmailConfirmation) {
        setConfirmationSent(true);
        return;
      }
      navigate('/');
    } catch (err: unknown) {
      console.error('Sign up error:', err);
      setError(formatAuthError(err, 'auth.errors.signUpFailed'));
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
          <AppLogo size={56} className="w-14 h-14 mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">{t('auth.title')}</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">{t('auth.subtitle')}</p>
        </div>

        <Card variant="glass" padding="lg" className="shadow-apple-lg">
          {confirmationSent ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto">
                <MailCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {t('auth.confirmEmailTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                {t('auth.confirmEmailDesc', { email: email.trim() })}
              </p>
              <Link
                to="/login"
                className="inline-block text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                {t('auth.signIn')}
              </Link>
            </div>
          ) : (
          <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {t('auth.signUp')}
            </h2>

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
              label={t('auth.name')}
              autoComplete="name"
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              required
              autoFocus
            />

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
            />

            <div>
              <Input
                label={t('auth.password')}
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
              />
            </div>

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
              {t('auth.signUpAction')}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {t('auth.hasAccount')}{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
              >
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
          </>
          )}
        </Card>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('auth.secureSession')}</span>
        </div>
      </motion.div>
    </div>
  );
};
