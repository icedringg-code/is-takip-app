import { supabase } from '../lib/supabase';
import { Company, CompanyWithStats, Transaction } from '../types';

export async function getJobCompanies(jobId: string): Promise<CompanyWithStats[]> {
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (companiesError) throw companiesError;
  if (!companies) return [];

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('job_id', jobId);

  return companies.map((company) => {
    const stats = calculateCompanyStats(company, transactions || []);
    return {
      ...company,
      ...stats,
    };
  });
}

function calculateCompanyStats(
  company: Company,
  transactions: Transaction[]
): Partial<CompanyWithStats> {
  const companyTransactions = transactions.filter(
    (t) => t.company_id === company.id
  );

  if (company.type === 'Çalışan') {
    const totalReceivable = companyTransactions
      .filter((t) => t.note === 'Alacak')
      .reduce((sum, t) => sum + Number(t.income), 0);

    const paymentsMade = companyTransactions
      .filter((t) => t.note === 'Ödeme Alındı')
      .reduce((sum, t) => sum + Number(t.income), 0);

    const receivable = totalReceivable - paymentsMade;
    let status = 'Dengede';
    if (receivable > 0) status = 'Alacaklı';
    else if (receivable < 0) status = 'Fazla Ödendi';

    return {
      totalReceivable,
      paymentsMade,
      receivable,
      status,
    };
  } else {
    const employerIncome = companyTransactions
      .filter((t) => t.note === 'Gelir' || t.note === 'Tahsilat' || t.note === 'Hakediş Alındı')
      .reduce((sum, t) => sum + Number(t.income), 0);

    const employerExpense = companyTransactions
      .filter((t) => t.note === 'İşveren Harcaması')
      .reduce((sum, t) => sum + Number(t.expense), 0);

    const paymentsToEmployees = companyTransactions
      .filter((t) => t.note === 'Ödeme Yapıldı')
      .reduce((sum, t) => sum + Number(t.expense), 0);

    const totalExpense = employerExpense + paymentsToEmployees;
    const receivable = totalExpense - employerIncome;

    let status = 'Dengede';
    if (receivable > 0) status = 'Alacaklı';
    else if (receivable < 0) status = 'Borçlu';

    return {
      employerIncome,
      employerExpense: totalExpense,
      receivable,
      status,
    };
  }
}

export async function createCompany(data: {
  jobId: string;
  name: string;
  type: 'İşveren' | 'Çalışan';
}): Promise<Company> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      job_id: data.jobId,
      user_id: user.id,
      name: data.name,
      type: data.type,
    })
    .select()
    .single();

  if (error) throw error;
  return company;
}

export async function getCompany(companyId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateCompany(
  companyId: string,
  updates: { name: string }
): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCompany(companyId: string): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (error) throw error;
}
