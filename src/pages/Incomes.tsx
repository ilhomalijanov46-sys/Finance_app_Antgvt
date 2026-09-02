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
import { IncomeForm } from '../components/forms/IncomeForm';
import { StatCard } from '../components/common/StatCard';
import { exportToCSV } from '../utils/exportImport';
import { Income, IncomeCategory } from '../types';
import { CategoryManagerModal } from '../components/modals/CategoryManagerModal';
import { getCategoryColor, toDateKey } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Plus,
  Search,
  Download,
  Layers,
  ArrowDownLeft,
  Tags,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

import { PeriodSelector, PeriodType, DateRange } from '../components/ui/PeriodSelector';

const defaultIncomeCategoriesList: IncomeCategory[] = [
  'salary',
  'advance',
  'bonus',
  'freelance',
  'sale',
  'gift',
  'investments',
  'other',
];

export const Incomes: React.FC = () => {
  const { t } = useTranslation();
  const { incomes, deleteIncome, customCategories } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [period, setPeriod] = useState<PeriodType>('all');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null);

  // Filter incomes
  const filteredIncomes = useMemo(() => {
    const today = toDateKey();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = toDateKey(yesterdayDate);

    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
    const sevenDaysAgo = toDateKey(sevenDaysAgoDate);

    const thirtyDaysAgoDate = new Date();
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const thirtyDaysAgo = toDateKey(thirtyDaysAgoDate);

    const ninetyDaysAgoDate = new Date();
    ninetyDaysAgoDate.setDate(ninetyDaysAgoDate.getDate() - 90);
    const ninetyDaysAgo = toDateKey(ninetyDaysAgoDate);

    const currentYearMonth = today.substring(0, 7);

    return incomes.filter((item) => {
      // 1. Category
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      // 2. Method
      const matchesMethod =
        selectedMethod === 'all' || (item.payment_method || 'card') === selectedMethod;

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
      const categoryName = t(`incomes.categories.${item.category}`, { defaultValue: item.category });
      const matchesSearch =
        searchQuery === '' ||
        (item.source && item.source.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesMethod && matchesDate && matchesSearch;
    });
  }, [incomes, selectedCategory, selectedMethod, period, customRange, searchQuery, t]);

  const totalAmount = filteredIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const avgAmount = filteredIncomes.length > 0 ? totalAmount / filteredIncomes.length : 0;

  const handleExportCSV = () => {
    exportToCSV(filteredIncomes, []);
  };

  const userIncomeCategories = customCategories.filter((c) => c.type === 'income');

  const categoryFilterOptions = [
    { value: 'all', label: t('common.allCategories') },
    ...defaultIncomeCategoriesList.map((cat) => ({
      value: cat,
      label: t(`incomes.categories.${cat}`),
      color: getCategoryColor(cat),
    })),
    ...userIncomeCategories.map((cat) => ({
      value: cat.name,
      label: cat.name,
      color: cat.color || getCategoryColor(cat.name),
    })),
  ];

  const methodFilterOptions = [
    { value: 'all', label: t('common.allMethods', { defaultValue: 'Все способы' }) },
    { value: 'card', label: t('expenses.methods.card', { defaultValue: 'Банковская карта' }) },
    { value: 'cash', label: t('expenses.methods.cash', { defaultValue: 'Наличные' }) },
    { value: 'transfer', label: t('expenses.methods.transfer', { defaultValue: 'Банковский перевод' }) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            {t('incomes.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t('incomes.subtitle')}
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
            {t('incomes.add')}
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('incomes.total')}
          value={totalAmount}
          icon={<TrendingUp className="w-4 h-4" />}
          highlightColor="#10b981"
        />
        <StatCard
          title={t('incomes.average')}
          value={avgAmount}
          icon={<ArrowDownLeft className="w-4 h-4" />}
          highlightColor="#06b6d4"
        />
        <StatCard
          title={t('incomes.count')}
          value={filteredIncomes.length}
          isCurrency={false}
          icon={<Layers className="w-4 h-4" />}
          highlightColor="#8b5cf6"
        />
      </div>

      {/* Modern Filter and Search Bar with PeriodSelector */}
      <div className="p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-apple-sm relative z-30 space-y-3">
        {/* Filter Bar Header with Title and Organic Reset Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {t('common.filter', { defaultValue: 'Фильтры и поиск' })}
            </span>
            {filteredIncomes.length !== incomes.length && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Найдено: {filteredIncomes.length}
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

        {/* 4 Clean Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-1">
            <Input
              placeholder={t('common.search') || 'Поиск по источнику, заметке или категории...'}
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

      {/* Incomes Cards Grid */}
      {filteredIncomes.length === 0 ? (
        <EmptyState
          icon={<ArrowDownLeft className="w-6 h-6" />}
          title={t('incomes.empty')}
          description={t('incomes.emptyDesc')}
          actionLabel={t('incomes.add')}
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncomes.map((income) => {
            const categoryLabel = t(`incomes.categories.${income.category}`, { defaultValue: income.category });
            const subtitleText = [income.source, income.note].filter(Boolean).join(' • ');

            return (
              <EntityCard
                key={income.id}
                variant="income"
                title={categoryLabel}
                subtitle={subtitleText}
                amount={income.amount}
                category={income.category}
                paymentMethod={income.payment_method || 'card'}
                date={income.date}
                time={income.time}
                onEdit={() => setEditingIncome(income)}
                onDelete={() => setDeletingIncomeId(income.id)}
              />
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('incomes.add')}
      >
        <IncomeForm
          onSuccess={() => setIsAddModalOpen(false)}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        isOpen={Boolean(editingIncome)}
        onClose={() => setEditingIncome(null)}
        title={t('incomes.edit')}
      >
        {editingIncome && (
          <IncomeForm
            initialData={editingIncome}
            onSuccess={() => setEditingIncome(null)}
            onCancel={() => setEditingIncome(null)}
          />
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingIncomeId)}
        onClose={() => setDeletingIncomeId(null)}
        onConfirm={async () => {
          if (deletingIncomeId) {
            await deleteIncome(deletingIncomeId);
            setDeletingIncomeId(null);
          }
        }}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        defaultType="income"
      />
    </div>
  );
};
