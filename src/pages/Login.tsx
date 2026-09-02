import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { Sparkles, ShieldCheck, ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const { signIn, signInDemo, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t('auth.errors.enterEmail'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password || 'password123');
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.errors.signInFailed');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setSubmitting(true);
    try {
      await signInDemo();
      navigate('/');
    } catch (err) {
      console.error(err);
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

        {/* Demo Fast Track Callout */}
        <Card
          variant="interactive"
          padding="sm"
          onClick={handleDemoLogin}
          className="border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 hover:border-blue-500/50 p-4 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-apple-sm">
                <Play className="w-4 h-4 fill-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    {t('auth.demoButton')}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold">
                    {t('auth.demoBadge')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  {t('auth.demoDesc')}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>

        {/* Standard Form */}
        <Card variant="glass" padding="lg" className="shadow-apple-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {t('auth.signIn')}
            </h2>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            <Input
              label={t('auth.email')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label={t('auth.password')}
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
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
                className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
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
