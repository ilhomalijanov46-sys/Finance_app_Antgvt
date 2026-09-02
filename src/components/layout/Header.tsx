import React, { useState } from 'react';
import { Menu, X, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { Dialog } from '../ui/Dialog';
import { IncomeForm } from '../forms/IncomeForm';
import { ExpenseForm } from '../forms/ExpenseForm';
import { GoalForm } from '../forms/GoalForm';

export interface HeaderProps {
  onOpenMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, isMobileMenuOpen }) => {
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState<'income' | 'expense' | 'goal' | null>(null);

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 backdrop-blur-xl bg-white/75 dark:bg-zinc-950/75 border-b border-slate-200/80 dark:border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between transition-colors">
        {/* Left Mobile Menu Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Right Actions: Quick Add, Language, Theme */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Actions Dropdown / Direct Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />}
              onClick={() => setActiveModal('income')}
              className="text-xs"
            >
              {t('dashboard.addIncome')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />}
              onClick={() => setActiveModal('expense')}
              className="text-xs"
            >
              {t('dashboard.addExpense')}
            </Button>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setActiveModal('goal')}
              className="text-xs"
            >
              {t('goals.add')}
            </Button>
          </div>

          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Quick Modals */}
      <Dialog
        isOpen={activeModal === 'income'}
        onClose={() => setActiveModal(null)}
        title={t('incomes.add')}
      >
        <IncomeForm onSuccess={() => setActiveModal(null)} onCancel={() => setActiveModal(null)} />
      </Dialog>

      <Dialog
        isOpen={activeModal === 'expense'}
        onClose={() => setActiveModal(null)}
        title={t('expenses.add')}
      >
        <ExpenseForm onSuccess={() => setActiveModal(null)} onCancel={() => setActiveModal(null)} />
      </Dialog>

      <Dialog
        isOpen={activeModal === 'goal'}
        onClose={() => setActiveModal(null)}
        title={t('goals.add')}
      >
        <GoalForm onSuccess={() => setActiveModal(null)} onCancel={() => setActiveModal(null)} />
      </Dialog>
    </>
  );
};
