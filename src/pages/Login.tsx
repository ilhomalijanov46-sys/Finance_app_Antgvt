import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatAuthError } from '../utils/authErrors';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const { signIn, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Пожалуйста, введите ваш email');
      return;
    }
    if (!password) {
      setError('Пожалуйста, введите пароль');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate('/');
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      setError(formatAuthError(err, 'Не удалось войти. Проверьте данные и попробуйте снова'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#fbfbfd] dark:bg-[#000000] text-slate-900 dark:text-zinc-100 relative selection:bg-blue-500/20">
      {/* Top right quick controls */}
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
        {/* Brand Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-apple-md shadow-blue-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('auth.title')}</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">{t('auth.subtitle')}</p>
        </div>

        {/* Standard Form */}
        <Card variant="glass" padding="lg" className="shadow-apple-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {t('auth.signIn')}
            </h2>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-fade-in font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label={t('auth.email')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              required
              autoFocus
            />

            <Input
              label={t('auth.password')}
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-xs font-semibold tracking-wide"
              isLoading={submitting || isLoading}
            >
              {t('auth.signInAction')}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
              >
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
        </Card>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('auth.secureSession')}</span>
        </div>
      </motion.div>
    </div>
  );
};
