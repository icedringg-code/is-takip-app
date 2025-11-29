import * as XLSX from 'xlsx';
import { Job } from '../types';
import { formatCurrency, formatDate } from './formatters';

export function exportJobsToExcel(jobs: Job[]) {
  const worksheetData = jobs.map((job) => ({
    'İş Adı': job.name,
    'Açıklama': job.description || '',
    'Durum': job.status,
    'Başlangıç Tarihi': formatDate(job.start_date),
    'Bitiş Tarihi': job.end_date ? formatDate(job.end_date) : '',
    'Toplam Yapılacak': formatCurrency((job as any).totalToBePaid || 0),
    'Toplam Yapılan': formatCurrency((job as any).totalPaid || 0),
    'Kalan': formatCurrency((job as any).totalRemaining || 0),
    'Toplam Gelir': formatCurrency((job as any).totalIncome || 0),
    'Toplam Gider': formatCurrency((job as any).totalExpense || 0),
    'Net Durum': formatCurrency((job as any).netBalance || 0),
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  const columnWidths = [
    { wch: 30 },
    { wch: 40 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'İşler');

  const fileName = `isler_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
