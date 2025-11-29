import { useEffect, useState } from 'react';
import { Plus, Briefcase, LogOut, TrendingUp, TrendingDown, DollarSign, FileDown } from 'lucide-react';
import { signOut } from '../lib/auth';
import { getJobs } from '../services/jobs';
import { calculateOverallStats } from '../services/statistics';
import { Job, OverallStats } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportJobsToExcel } from '../utils/excelExport';
import JobCard from '../components/JobCard';
import AddJobModal from '../components/AddJobModal';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  onJobClick: (jobId: string) => void;
}

export default function Dashboard({ onJobClick }: DashboardProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Aktif' | 'Tamamlandı' | 'Duraklatıldı'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [jobsData, statsData] = await Promise.all([
        getJobs(),
        calculateOverallStats(),
      ]);
      setJobs(jobsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);

  const filterCounts = {
    all: jobs.length,
    Aktif: jobs.filter((j) => j.status === 'Aktif').length,
    Tamamlandı: jobs.filter((j) => j.status === 'Tamamlandı').length,
    Duraklatıldı: jobs.filter((j) => j.status === 'Duraklatıldı').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Briefcase className="w-6 h-6" />
              <h1 className="text-xl font-bold">İş Takip Sistemi</h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => exportJobsToExcel(jobs)}
                disabled={jobs.length === 0}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Excel'e Aktar"
              >
                <FileDown className="w-5 h-5" />
                <span className="hidden sm:inline">Excel'e Aktar</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Yeni İş</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300 hidden md:inline">{user?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                  title="Çıkış"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Toplam Gelir</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalIncome)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Toplam Gider</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalExpense)}</p>
                </div>
                <TrendingDown className="w-12 h-12 text-red-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Net Durum</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.netBalance)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-blue-200" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(
            [
              { key: 'all', label: 'Toplam İş', color: 'bg-blue-600' },
              { key: 'Aktif', label: 'Aktif', color: 'bg-green-600' },
              { key: 'Tamamlandı', label: 'Tamamlanan', color: 'bg-purple-600' },
              { key: 'Duraklatıldı', label: 'Duraklatılan', color: 'bg-yellow-600' },
            ] as const
          ).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`${color} ${
                filter === key ? 'ring-4 ring-offset-2 ring-blue-300' : ''
              } text-white rounded-xl shadow-lg p-4 hover:opacity-90 transition-all`}
            >
              <p className="text-sm font-medium opacity-90">{label}</p>
              <p className="text-3xl font-bold mt-2">{filterCounts[key]}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {filter === 'all' ? 'Tüm İşler' : `${filter} İşler`} ({filteredJobs.length})
            </h2>
          </div>

          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onUpdate={loadData}
                  onClick={() => onJobClick(job.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {filter === 'all' ? 'Henüz iş yok.' : 'Bu kategoride iş bulunamadı.'}
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  İlk İşinizi Oluşturun
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <AddJobModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
