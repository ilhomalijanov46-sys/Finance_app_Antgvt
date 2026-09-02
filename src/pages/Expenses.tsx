import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { EntityCard } from '../components/common/EntityCard';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Dialog } from '../components/ui/Dialog';
import { ExpenseForm } from '../components/forms/ExpenseForm';
import { StatCard } from '../components/common/StatCard';
import { exportToCSV } from '../utils/exportImport';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';
import { CategoryManagerModal } from '../components/modals/CategoryManagerModal';
import { getCategoryColor } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown,
  Plus,
  Search,
  Download,
  CreditCard,
  Calendar as CalendarIcon,
  ArrowUpRight,
  Tags,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

import { PeriodSelector, PeriodType, DateRange } from '../components/ui/PeriodSelector';

const defaultCategoriesList: ExpenseCategory[] = [
  'groceries',
  'dining',
  'transport',
  'taxi',
  'internet',
  'mobile',
  'utilities',
  'rent',
  'loans',
  'subscriptions',
  'entertainment',
  'clothing',
  'health',
  'home',
  'travel',
  'pets',
  'miscellaneous',
];

const paymentMethodsList: PaymentMethod[] = ['card', 'cash', 'transfer'];

export const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const { expenses, deleteExpense, customCategories } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [period, setPeriod] = useState<PeriodType>('all');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Filtering
  const filteredExpenses = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
    const sevenDaysAgo = sevenDaysAgoDate.toISOString().split('T')[0];

    const thirtyDaysAgoDate = new Date();
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const thirtyDaysAgo = thirtyDaysAgoDate.toISOString().split('T')[0];

    const ninetyDaysAgoDate = new Date();
    ninetyDaysAgoDate.setDate(ninetyDaysAgoDate.getDate() - 90);
    const ninetyDaysAgo = ninetyDaysAgoDate.toISOString().split('T')[0];

    const currentYearMonth = today.substring(0, 7);

    return expenses.filter((item) => {
      // 1. Category
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      // 2. Method
      const matchesMethod =
        selectedMethod === 'all' || item.payment_method === selectedMethod;

      // 3. Date
      let matchesDate = true;
      if (period === 'today') {
        matchesDate = item.date === today;
      } else if (period === 'yesterday') {
        matchesDate = item.date === yesterday;
      } else if (period === '7days') {
        matchesDate = item.date >= sevenDaysAgo && item.date <= today;
      } else if (period === '30days') {
        matchesDate = item.date >= thirtyDaysAgo && item.date <= today;
      } else if (period === '90days') {
        matchesDate = item.date >= ninetyDaysAgo && item.date <= today;
      } else if (period === 'this_month') {
        matchesDate = item.date.startsWith(currentYearMonth);
      } else if (period === 'custom' && customRange?.startDate && customRange?.endDate) {
        matchesDate = item.date >= customRange.startDate && item.date <= customRange.endDate;
      }

      // 4. Search
      const categoryName = t(`expenses.categories.${item.category}`, { defaultValue: item.category });
      const matchesSearch =
        searchQuery === '' ||
        (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesMethod && matchesDate && matchesSearch;
    });
  }, [expenses, selectedCategory, selectedMethod, period, customRange, searchQuery, t]);

  const totalAmount = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const avgAmount = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;
  const daysInMonth = 30;
  const dailyAvg = totalAmount / daysInMonth;

  const handleExportCSV = () => {
    exportToCSV([], filteredExpenses);
  };

  const userExpenseCategories = customCategories.filter((c) => c.type === 'expense');

  const categoryFilterOptions = [
    { value: 'all', label: t('common.allCategories') },
    ...defaultCategoriesList.map((cat) => ({
      value: cat,
      label: t(`expenses.categories.${cat}`),
      color: getCategoryColor(cat),
    })),
    ...userExpenseCategories.map((cat) => ({
      value: cat.name,
      label: cat.name,
      color: cat.color || getCategoryColor(cat.name),
    })),
  ];

  const methodFilterOptions = [
    { value: 'all', label: t('common.allMethods') || 'Все способы' },
    ...paymentMethodsList.map((pm) => ({
      value: pm,
      label: t(`expenses.methods.${pm}`),
    })),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            {t('expenses.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t('expenses.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="glass"
            leftIcon={<Tags className="w-3.5 h-3.5" />}
            onClick={() => setIsCategoryModalOpen(true)}
          >
            Категории
          </Button>
          <Button
            size="sm"
            variant="glass"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCSV}
          >
            CSV
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            {t('expenses.add')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('expenses.total')}
          value={totalAmount}
          icon={<TrendingDown className="w-4 h-4" />}
          highlightColor="#f43f5e"
        />
        <StatCard
          title={t('expenses.average')}
          value={avgAmount}
          icon={<CreditCard className="w-4 h-4" />}
          highlightColor="#8b5cf6"
        />
        <StatCard
          title={t('expenses.dailyAverage')}
          value={dailyAvg}
          icon={<CalendarIcon className="w-4 h-4" />}
          highlightColor="#f59e0b"
        />
      </div>

      {/* Modern Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-apple-sm relative z-30 space-y-3">
        {/* Filter Bar Header with Title and Organic Reset Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {t('common.filter', { defaultValue: 'Фильтры и поиск' })}
            </span>
            {filteredExpenses.length !== expenses.length && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Найдено: {filteredExpenses.length}
              </span>
            )}
          </div>

          <AnimatePresence>
            {(selectedCategory !== 'all' || selectedMethod !== 'all' || period !== 'all' || searchQuery) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedMethod('all');
                  setPeriod('all');
                  setCustomRange(undefined);
                  setSearchQuery('');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 transition-all shadow-apple-sm"
              >
                <RotateCcw className="w-3 h-3" /> Сбросить фильтры
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* 4 Clean Filter Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-1">
            <Input
              placeholder={t('common.search') || 'Поиск по названию или заметке...'}
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categoryFilterOptions}
            />
          </div>
          <div>
            <Select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              options={methodFilterOptions}
            />
          </div>
          <div>
            <PeriodSelector
              value={period}
              customRange={customRange}
              onChange={(p, range) => {
                setPeriod(p);
                if (range) setCustomRange(range);
              }}
              showAllOption={true}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Expenses Grid */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<ArrowUpRight className="w-6 h-6" />}
          title={t('expenses.empty')}
          description={t('expenses.emptyDesc')}
          actionLabel={t('expenses.add')}
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExpenses.map((expense) => {
            const categoryLabel = t(`expenses.categories.${expense.category}`, { defaultValue: expense.category });

            return (
              <EntityCard
                key={expense.id}
                variant="expense"
                title={categoryLabel}
                subtitle={expense.note}
                amount={expense.amount}
                category={expense.category}
                paymentMethod={expense.payment_method}
                date={expense.date}
                time={expense.time}
                onEdit={() => setEditingExpense(expense)}
                onDelete={() => setDeletingExpenseId(expense.id)}
              />
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('expenses.add')}
      >
        <ExpenseForm
          onSuccess={() => setIsAddModalOpen(false)}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        title={t('expenses.edit')}
      >
        {editingExpense && (
          <ExpenseForm
            initialData={editingExpense}
            onSuccess={() => setEditingExpense(null)}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingExpenseId)}
        onClose={() => setDeletingExpenseId(null)}
        onConfirm={async () => {
          if (deletingExpenseId) {
            await deleteExpense(deletingExpenseId);
            setDeletingExpenseId(null);
          }
        }}
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
