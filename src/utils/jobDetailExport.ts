import * as XLSX from 'xlsx';
import { Job, JobStats, CompanyWithStats, Transaction } from '../types';
import { formatCurrency, formatDate } from './formatters';

export function exportJobDetailToExcel(
  job: Job,
  stats: JobStats | null,
  employers: CompanyWithStats[],
  employees: CompanyWithStats[],
  transactions: Transaction[]
) {
  const workbook = XLSX.utils.book_new();

  const jobInfoData = [
    ['İş Bilgileri'],
    ['İş Adı', job.name],
    ['Açıklama', job.description || ''],
    ['Durum', job.status],
    ['Başlangıç Tarihi', formatDate(job.start_date)],
    ['Bitiş Tarihi', job.end_date ? formatDate(job.end_date) : ''],
    [],
    ['Finansal Özet'],
  ];

  if (stats) {
    jobInfoData.push(
      ['Toplam Gelir', formatCurrency(stats.totalIncome)],
      ['Toplam Gider', formatCurrency(stats.totalExpense)],
      ['Net Durum', formatCurrency(stats.netBalance)],
      ['Yapılacak Ödeme', formatCurrency(stats.totalToBePaid)],
      ['Kalan Borç', formatCurrency(stats.totalRemaining)]
    );
  }

  const jobInfoSheet = XLSX.utils.aoa_to_sheet(jobInfoData);
  jobInfoSheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, jobInfoSheet, 'İş Bilgileri');

  if (employers.length > 0) {
    const employersData = employers.map((employer) => ({
      'İşveren Adı': employer.name,
      'Durum': employer.status,
      'Gelir': formatCurrency(employer.employerIncome || 0),
      'Gider': formatCurrency(employer.employerExpense || 0),
    }));
    const employersSheet = XLSX.utils.json_to_sheet(employersData);
    employersSheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, employersSheet, 'İşverenler');
  }

  if (employees.length > 0) {
    const employeesData = employees.map((employee) => ({
      'Çalışan Adı': employee.name,
      'Toplam Alacak': formatCurrency(employee.totalReceivable || 0),
      'Yapılan Ödeme': formatCurrency(employee.paymentsMade || 0),
      'Kalan Alacak': formatCurrency(employee.receivable || 0),
    }));
    const employeesSheet = XLSX.utils.json_to_sheet(employeesData);
    employeesSheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, employeesSheet, 'Çalışanlar');
  }

  if (transactions.length > 0) {
    const transactionsData = transactions.map((transaction) => ({
      'Tarih': formatDate(transaction.date),
      'İşlem Yapan': transaction.performed_by?.name || '-',
      'İşlem Yapan Tipi': transaction.performed_by?.type || '-',
      'İşlem Yapılan': transaction.company?.name || '-',
      'İşlem Yapılan Tipi': transaction.company?.type || '-',
      'Açıklama': transaction.description,
      'Tip': transaction.note,
      'Gelir': transaction.income > 0 ? formatCurrency(transaction.income) : '-',
      'Gider': transaction.expense > 0 ? formatCurrency(transaction.expense) : '-',
    }));
    const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
    transactionsSheet['!cols'] = [
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'İşlemler');
  }

  const fileName = `${job.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
