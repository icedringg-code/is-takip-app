import { supabase } from '../lib/supabase';
import { Transaction } from '../types';

export async function getJobTransactions(jobId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      company:company_id(id, name, type),
      performed_by:performed_by_id(id, name, type)
    `)
    .eq('job_id', jobId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCompanyTransactions(companyId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      company:company_id(id, name, type),
      performed_by:performed_by_id(id, name, type)
    `)
    .or(`company_id.eq.${companyId},performed_by_id.eq.${companyId}`)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createEmployeeReceivable(data: {
  jobId: string;
  companyId: string;
  amount: number;
  description: string;
  date: string;
}): Promise<Transaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.companyId,
      performed_by_id: data.companyId,
      user_id: user.id,
      date: data.date,
      description: data.description,
      income: data.amount,
      expense: 0,
      note: 'Alacak',
    })
    .select()
    .single();

  if (error) throw error;
  return transaction;
}

export async function createEmployerIncome(data: {
  jobId: string;
  companyId: string;
  amount: number;
  description: string;
  date: string;
}): Promise<Transaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.companyId,
      performed_by_id: data.companyId,
      user_id: user.id,
      date: data.date,
      description: data.description,
      income: data.amount,
      expense: 0,
      note: 'Gelir',
    })
    .select()
    .single();

  if (error) throw error;
  return transaction;
}

export async function createEmployerExpense(data: {
  jobId: string;
  companyId: string;
  amount: number;
  description: string;
  date: string;
}): Promise<Transaction> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.companyId,
      performed_by_id: data.companyId,
      user_id: user.id,
      date: data.date,
      description: data.description,
      income: 0,
      expense: data.amount,
      note: 'İşveren Harcaması',
    })
    .select()
    .single();

  if (error) throw error;
  return transaction;
}

export async function createPaymentToEmployee(data: {
  jobId: string;
  employerId: string;
  employeeId: string;
  amount: number;
  description: string;
  date: string;
}): Promise<{ receiverTransaction: Transaction; payerTransaction: Transaction }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const receiverData = {
    job_id: data.jobId,
    company_id: data.employeeId,
    performed_by_id: data.employerId,
    user_id: user.id,
    date: data.date,
    description: data.description,
    income: data.amount,
    expense: 0,
    note: 'Ödeme Alındı',
  };

  const payerData = {
    job_id: data.jobId,
    company_id: data.employerId,
    performed_by_id: data.employerId,
    user_id: user.id,
    date: data.date,
    description: data.description,
    income: 0,
    expense: data.amount,
    note: 'Ödeme Yapıldı',
  };

  const { data: receiverTransaction, error: receiverError } = await supabase
    .from('transactions')
    .insert(receiverData)
    .select()
    .single();

  if (receiverError) throw receiverError;

  const { data: payerTransaction, error: payerError } = await supabase
    .from('transactions')
    .insert(payerData)
    .select()
    .single();

  if (payerError) throw payerError;

  return { receiverTransaction, payerTransaction };
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (error) throw error;
}
