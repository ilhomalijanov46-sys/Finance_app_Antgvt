import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { exportToJSON, exportToCSV } from '../utils/exportImport';
import { formatDbError } from '../utils/dbErrors';
import { dataService } from '../services/dataService';
import { CurrencyCode, LocaleCode, ThemeMode } from '../types';
import { CategoryManagerModal } from '../components/modals/CategoryManagerModal';
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  RotateCcw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Tags,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isDemoMode, signOut, updateUserPreferences } = useAuth();
  const { theme, setTheme } = useTheme();
  const { incomes, expenses, budgets, goals, refetchAll } = useData();

  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState<CurrencyCode>(user?.currency || 'USD');
  const [locale, setLocale] = useState<LocaleCode>((user?.locale || i18n.language) as LocaleCode);
  const [isSavedMessageVisible, setIsSavedMessageVisible] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the pending timer so it can't fire setState after the page unmounts
  useEffect(() => {
    return () => {
      if (savedMessageTimer.current !== null) clearTimeout(savedMessageTimer.current);
    };
  }, []);

  // The header's language switcher changes i18n directly, which used to leave this form
  // showing the old language while the rest of the app had already switched.
  useEffect(() => {
    setLocale(i18n.language as LocaleCode);
  }, [i18n.language]);

  // The profile arrives asynchronously and can be changed elsewhere; mirror it instead of
  // freezing whatever was known at first render.
  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setCurrency(user.currency || 'USD');
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    // The profile write can be rejected (expired session, RLS). It used to fail silently
    // while still showing "Saved", so the user believed a change had been stored.
    try {
      await updateUserPreferences({ name, currency, locale, theme });
    } catch (err) {
      console.error('Failed to save profile:', err);
      setSaveError(formatDbError(err, 'profile.saveFailed'));
      return;
    }

    i18n.changeLanguage(locale);
    localStorage.setItem('pft_locale', locale);
    setIsSavedMessageVisible(true);
    if (savedMessageTimer.current !== null) clearTimeout(savedMessageTimer.current);
    savedMessageTimer.current = setTimeout(() => setIsSavedMessageVisible(false), 3000);
  };

  const handleExportJSON = () => {
    exportToJSON({ incomes, expenses, budgets, goals });
  };

  const handleExportCSV = () => {
    exportToCSV(incomes, expenses);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => setImportStatus({ ok: false, message: t('profile.importError') });
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Accept the file only if it actually looks like a backup, otherwise any JSON
        // would be imported as an empty dataset and wipe what is already stored.
        const sections = ['incomes', 'expenses', 'budgets', 'goals'] as const;
        const present = sections.filter((key) => Array.isArray(json?.[key]));
        if (present.length === 0) {
          setImportStatus({ ok: false, message: t('profile.importError') });
          return;
        }

        setIsBusy(true);
        setImportStatus({ ok: true, message: t('profile.importRunning') });

        const { imported, total } = await dataService.importBackup(json, user?.id || '');
        await refetchAll();

        setImportStatus(
          imported === total
            ? { ok: true, message: t('profile.importSuccess') }
            : { ok: false, message: t('profile.importPartial', { ok: imported, total }) }
        );
      } catch (err) {
        console.error('Import failed:', err);
        setImportStatus({ ok: false, message: formatDbError(err, 'profile.importError') });
      } finally {
        setIsBusy(false);
        // Reset the input, otherwise picking the same file again fires no change event
        input.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    setIsBusy(true);
    try {
      await dataService.resetAll(user?.id || '');
      await refetchAll();
      setImportStatus({ ok: true, message: t('profile.resetSuccess') });
    } catch (err) {
      console.error('Reset failed:', err);
      setImportStatus({ ok: false, message: formatDbError(err, 'profile.resetFailed') });
    } finally {
      setIsBusy(false);
      setIsResetConfirmOpen(false);
    }
  };

  const themeTabs = [
    { id: 'system', label: t('profile.themes.system'), icon: <Laptop className="w-3.5 h-3.5" /> },
    { id: 'light', label: t('profile.themes.light'), icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'dark', label: t('profile.themes.dark'), icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  const currencyOptions = [
    { value: 'USD', label: t('profile.currencies.USD') },
    { value: 'UZS', label: t('profile.currencies.UZS') },
    { value: 'EUR', label: t('profile.currencies.EUR') },
    { value: 'RUB', label: t('profile.currencies.RUB') },
  ];

  const languageOptions = [
    { value: 'ru', label: '🇷🇺 Русский' },
    { value: 'en', label: '🇺🇸 English' },
    { value: 'uz', label: "🇺🇿 O'zbekcha" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          {t('profile.title')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* User Info & Settings Form */}
      <Card variant="glass" padding="lg" className="space-y-6">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-bold text-white shadow-apple-md">
                {name?.[0] || 'U'}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                {name || 'User'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('profile.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label={t('profile.email')}
              value={user?.email || ''}
              disabled
              helperText={t('profile.managedByAuth')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Select
                label={t('profile.currency')}
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                options={currencyOptions}
                helperText={t('profile.currencyDesc')}
              />
            </div>

            <div>
              <Select
                label={t('profile.language')}
                value={locale}
                onChange={(e) => setLocale(e.target.value as LocaleCode)}
                options={languageOptions}
              />
            </div>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
              {t('profile.theme')}
            </label>
            <Tabs
              tabs={themeTabs}
              activeTab={theme}
              onChange={(tId) => setTheme(tId as ThemeMode)}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
            {isSavedMessageVisible && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                {t('profile.saveSuccess')}
              </span>
            )}
            {!isSavedMessageVisible && saveError && (
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {saveError}
              </span>
            )}
            {!isSavedMessageVisible && !saveError && <div />}

            <Button type="submit" variant="primary">
              {t('profile.save')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Categories Management */}
      <Card variant="glass" padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Tags className="w-4 h-4 text-blue-500" />
              <span>{t('categories.sectionTitle')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {t('categories.sectionDesc')}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Tags className="w-3.5 h-3.5" />}
            onClick={() => setIsCategoryModalOpen(true)}
          >
            {t('categories.manage')}
          </Button>
        </div>
      </Card>

      {/* Data Backup & Management */}
      <Card variant="glass" padding="lg" className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
          {t('profile.dataManagement')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          {t('profile.dataManagementDesc')}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportJSON}
          >
            {t('profile.exportJson')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            {t('profile.exportCsv')}
          </Button>
          <Button
            size="sm"
            variant="glass"
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            onClick={handleImportClick}
            disabled={isBusy}
          >
            {t('profile.importData')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => setIsResetConfirmOpen(true)}
            disabled={isBusy}
          >
            {t('profile.resetData')}
          </Button>
        </div>

        {importStatus && (
          <p
            className={
              importStatus.ok
                ? 'text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in'
                : 'text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-fade-in'
            }
            role="status"
          >
            {importStatus.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {importStatus.message}
          </p>
        )}
      </Card>

      {/* Sign Out Card */}
      <Card variant="glass" padding="md" className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
            {t('auth.logout')}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            {t('profile.logoutDesc')}
          </p>
        </div>

        <Button
          size="sm"
          variant="danger"
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
          onClick={signOut}
        >
          {t('auth.logout')}
        </Button>
      </Card>

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title={t('profile.resetDataTitle')}
        description={isDemoMode ? t('profile.resetDesc') : t('profile.resetDescReal')}
        confirmLabel={t('profile.resetNow')}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        defaultType="expense"
      />
    </div>
  );
};
