import { Income, Expense, Budget, Goal } from '../types';

export const exportToJSON = (data: {
  incomes: Income[];
  expenses: Expense[];
  budgets: Budget[];
  goals: Goal[];
}): void => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToCSV = (
  incomes: Income[],
  expenses: Expense[]
): void => {
  const rows: string[] = ['Type,Date,Category,Amount,PaymentMethodOrSource,Note'];

  for (const inc of incomes) {
    rows.push(
      `Income,${inc.date},${inc.category},${inc.amount},"${inc.source || ''}","${(inc.note || '').replace(/"/g, '""')}"`
    );
  }

  for (const exp of expenses) {
    rows.push(
      `Expense,${exp.date},${exp.category},${exp.amount},"${exp.payment_method}","${(exp.note || '').replace(/"/g, '""')}"`
    );
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(rows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `finance_transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
