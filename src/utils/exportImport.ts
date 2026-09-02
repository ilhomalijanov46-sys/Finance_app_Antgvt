import { Income, Expense, Budget, Goal } from '../types';
import { toDateKey } from './formatters';

// Hands the browser a generated file. The object URL is released on a later tick because
// revoking it synchronously after click() can cancel the download before it starts, and
// the anchor has to be in the document for the click to count in Firefox.
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 0);
};

export const exportToJSON = (data: {
  incomes: Income[];
  expenses: Expense[];
  budgets: Budget[];
  goals: Goal[];
}): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `finance_backup_${toDateKey()}.json`);
};

// Every field goes through this: custom category names, sources and notes are free text
// and may contain commas, quotes or newlines, any of which would otherwise shift the
// remaining columns of the row.
const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export const exportToCSV = (incomes: Income[], expenses: Expense[]): void => {
  const rows: string[] = [
    ['Type', 'Date', 'Time', 'Category', 'Amount', 'PaymentMethod', 'Source', 'Note']
      .map(csvCell)
      .join(','),
  ];

  for (const inc of incomes) {
    rows.push([
      csvCell('Income'),
      csvCell(inc.date),
      csvCell(inc.time),
      csvCell(inc.category),
      csvCell(inc.amount),
      csvCell(inc.payment_method),
      csvCell(inc.source),
      csvCell(inc.note),
    ].join(','));
  }

  for (const exp of expenses) {
    rows.push([
      csvCell('Expense'),
      csvCell(exp.date),
      csvCell(exp.time),
      csvCell(exp.category),
      csvCell(exp.amount),
      csvCell(exp.payment_method),
      csvCell(''),
      csvCell(exp.note),
    ].join(','));
  }

  // A Blob rather than a data: URI — the URI form is capped by the browser's URL length
  // limit and silently truncates large exports. The BOM keeps Cyrillic readable in Excel.
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `finance_transactions_${toDateKey()}.csv`);
};
