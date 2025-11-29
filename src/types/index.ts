export interface Job {
  id: string;
  user_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string | null;
  status: 'Aktif' | 'Tamamlandı' | 'Duraklatıldı';
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  job_id: string;
  user_id: string;
  name: string;
  type: 'İşveren' | 'Çalışan';
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  job_id: string;
  company_id: string;
  performed_by_id: string | null;
  user_id: string;
  date: string;
  description: string;
  income: number;
  expense: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface JobStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalToBePaid: number;
  totalPaid: number;
  totalRemaining: number;
}

export interface CompanyWithStats extends Company {
  totalReceivable?: number;
  paymentsMade?: number;
  employerIncome?: number;
  employerExpense?: number;
  receivable?: number;
  status?: string;
}

export interface OverallStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  pausedJobs: number;
}
