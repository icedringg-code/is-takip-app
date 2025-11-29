import { supabase } from '../lib/supabase';
import { OverallStats, JobStats } from '../types';

export async function calculateOverallStats(): Promise<OverallStats> {
  const { data: jobs } = await supabase.from('jobs').select('*');
  const { data: transactions } = await supabase.from('transactions').select('*');
  const { data: companies } = await supabase.from('companies').select('*');

  let totalIncome = 0;
  let totalExpense = 0;

  if (transactions && companies) {
    transactions.forEach((transaction) => {
      const company = companies.find((c) => c.id === transaction.company_id);
      if (!company) return;

      if (company.type === 'İşveren') {
        if (transaction.note === 'Gelir' || transaction.note === 'Tahsilat' || transaction.note === 'Hakediş Alındı') {
          totalIncome += Number(transaction.income);
        } else if (transaction.note === 'İşveren Harcaması' || transaction.note === 'Ödeme Yapıldı') {
          totalExpense += Number(transaction.expense);
        }
      } else if (company.type === 'Çalışan') {
        if (transaction.note === 'Alacak') {
          totalExpense += Number(transaction.income);
        }
      }
    });
  }

  const stats: OverallStats = {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    totalJobs: jobs?.length || 0,
    activeJobs: jobs?.filter((j) => j.status === 'Aktif').length || 0,
    completedJobs: jobs?.filter((j) => j.status === 'Tamamlandı').length || 0,
    pausedJobs: jobs?.filter((j) => j.status === 'Duraklatıldı').length || 0,
  };

  return stats;
}

export async function calculateJobStats(jobId: string): Promise<JobStats> {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('job_id', jobId);

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('job_id', jobId);

  let totalIncome = 0;
  let totalExpense = 0;
  let totalToBePaid = 0;
  let totalPaid = 0;

  if (transactions && companies) {
    transactions.forEach((transaction) => {
      const company = companies.find((c) => c.id === transaction.company_id);
      if (!company) return;

      if (company.type === 'İşveren') {
        if (transaction.note === 'Gelir' || transaction.note === 'Tahsilat' || transaction.note === 'Hakediş Alındı') {
          totalIncome += Number(transaction.income);
        } else if (transaction.note === 'İşveren Harcaması' || transaction.note === 'Ödeme Yapıldı') {
          totalExpense += Number(transaction.expense);
        }
      } else if (company.type === 'Çalışan') {
        if (transaction.note === 'Alacak') {
          totalToBePaid += Number(transaction.income);
          totalExpense += Number(transaction.income);
        } else if (transaction.note === 'Ödeme Alındı') {
          totalPaid += Number(transaction.income);
        }
      }
    });
  }

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    totalToBePaid,
    totalPaid,
    totalRemaining: totalToBePaid - totalPaid,
  };
}
