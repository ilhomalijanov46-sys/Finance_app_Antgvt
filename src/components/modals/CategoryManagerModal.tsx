import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tabs } from '../ui/Tabs';
import { getCategoryColor } from '../../utils/formatters';
import { ExpenseCategory, IncomeCategory } from '../../types';
import {
  Tag,
  Plus,
  Trash2,
  Lock,
  Check,
  FolderPlus,
  AlertCircle,
} from 'lucide-react';

const defaultIncomeCategories: IncomeCategory[] = [
  'salary',
  'advance',
  'bonus',
  'freelance',
  'sale',
  'gift',
  'investments',
  'other',
];

const defaultExpenseCategories: ExpenseCategory[] = [
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

const PRESET_COLORS = [
  '#0071e3', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
];

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income';
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
}) => {
  const { t } = useTranslation();
  const { customCategories, addCustomCategory, deleteCustomCategory, incomes, expenses } = useData();

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(defaultType);
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const currentCustomCats = customCategories.filter((c) => c.type === activeTab);
  const defaultList = activeTab === 'income' ? defaultIncomeCategories : defaultExpenseCategories;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await addCustomCategory({
      name: newCatName.trim(),
      type: activeTab,
      color: selectedColor,
      icon: 'Tag',
    });

    setNewCatName('');
    setIsCreating(false);
  };

  const getUsageCount = (catName: string) => {
    if (activeTab === 'income') {
      return incomes.filter((i) => i.category === catName).length;
    }
    return expenses.filter((e) => e.category === catName).length;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        setIsCreating(false);
        setDeletingCatId(null);
        onClose();
      }}
      title="Управление категориями"
      description="Добавляйте персональные категории или просматривайте системные"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Type Tabs */}
        <div className="flex justify-center">
          <Tabs
            tabs={[
              { id: 'expense', label: 'Категории расходов' },
              { id: 'income', label: 'Категории доходов' },
            ]}
            activeTab={activeTab}
            onChange={(id) => {
              setActiveTab(id as 'expense' | 'income');
              setIsCreating(false);
              setDeletingCatId(null);
            }}
            size="sm"
            layoutId="categoryManagerTabPill"
          />
        </div>

        {/* Add Category Button / Form */}
        {!isCreating ? (
          <Button
            type="button"
            variant="glass"
            className="w-full h-11 justify-center border-dashed border-2 text-xs font-semibold shrink-0"
            leftIcon={<Plus className="w-4 h-4 text-blue-500" />}
            onClick={() => setIsCreating(true)}
          >
            Добавить категорию ({activeTab === 'income' ? 'доход' : 'расход'})
          </Button>
        ) : (
          <form
            onSubmit={handleAddCategory}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                Новая категория ({activeTab === 'income' ? 'доход' : 'расход'})
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 font-medium"
              >
                Отмена
              </button>
            </div>

            <Input
              placeholder="Например: Фитнес, Криптовалюта, Образование"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              autoFocus
            />

            {/* Color Palette */}
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mb-1.5">
                Выберите цвет:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 shrink-0"
                    style={{ backgroundColor: c }}
                  >
                    {selectedColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs shrink-0"
                onClick={() => setIsCreating(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="h-8 text-xs shrink-0"
                disabled={!newCatName.trim()}
              >
                Создать
              </Button>
            </div>
          </form>
        )}

        {/* Custom Categories Section with FIXED container height */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Ваши категории ({currentCustomCats.length})
            </h4>
          </div>

          <div className="h-44 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
            {currentCustomCats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800/60 text-slate-400 dark:text-zinc-500">
                <FolderPlus className="w-7 h-7 mb-1.5 opacity-40 text-blue-500" />
                <p className="text-xs font-medium">Нет созданных категорий</p>
                <p className="text-[11px] opacity-75 mt-0.5">
                  Нажмите кнопку выше, чтобы добавить свою категорию
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentCustomCats.map((cat) => {
                  const count = getUsageCount(cat.name);
                  const isConfirmingDelete = deletingCatId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="h-12 px-3.5 rounded-xl bg-slate-50/90 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-3 shadow-apple-xs transition-colors"
                    >
                      {/* Left info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs text-xs font-bold"
                          style={{ backgroundColor: cat.color || getCategoryColor(cat.name) }}
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                          {cat.name}
                        </span>
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-zinc-700/70 text-slate-600 dark:text-zinc-300 font-medium">
                          {count} опер.
                        </span>
                      </div>

                      {/* Right action / inline confirm */}
                      {!isConfirmingDelete ? (
                        <button
                          type="button"
                          onClick={() => setDeletingCatId(cat.id)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center shrink-0 transition-colors"
                          title="Удалить категорию"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0 animate-fade-in">
                          <span className="text-[11px] text-rose-500 font-semibold hidden sm:inline">
                            Удалить?
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteCustomCategory(cat.id);
                              setDeletingCatId(null);
                            }}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-xs"
                          >
                            Да
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCatId(null)}
                            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 transition-colors"
                          >
                            Нет
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* System / Default Categories with FIXED container height */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" /> Системные категории ({defaultList.length})
            </h4>
          </div>

          <div className="h-32 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
            <div className="flex flex-wrap gap-1.5">
              {defaultList.map((cat) => {
                const name = t(`${activeTab === 'income' ? 'incomes' : 'expenses'}.categories.${cat}`);
                return (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100/90 dark:bg-zinc-800/90 text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700/60 shadow-xs shrink-0"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: getCategoryColor(cat) }}
                    />
                    <span className="truncate">{name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Системные категории нельзя удалить
          </span>
          <Button
            variant="primary"
            size="sm"
            className="h-9 px-5 text-xs font-bold shrink-0"
            onClick={() => {
              setIsCreating(false);
              setDeletingCatId(null);
              onClose();
            }}
          >
            Готово
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
