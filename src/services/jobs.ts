import { supabase } from '../lib/supabase';
import { Job } from '../types';
import { calculateJobStats } from './statistics';

export async function getJobs(): Promise<(Job & { stats?: any })[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const jobsWithStats = await Promise.all(
    (data || []).map(async (job) => {
      const stats = await calculateJobStats(job.id);
      return { ...job, ...stats };
    })
  );

  return jobsWithStats;
}

export async function getJob(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createJob(job: {
  name: string;
  description: string;
  start_date: string;
  end_date?: string;
  status: string;
}): Promise<Job> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      user_id: user.id,
      name: job.name,
      description: job.description,
      start_date: job.start_date,
      end_date: job.end_date || null,
      status: job.status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateJob(
  id: string,
  updates: Partial<Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
