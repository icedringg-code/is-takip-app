import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Users, Receipt, Plus, Trash2, Edit2, FileDown } from 'lucide-react';
import { Job, JobStats, CompanyWithStats, Transaction } from '../types';
import { getJob } from '../services/jobs';
import { calculateJobStats } from '../services/statistics';
import { getJobCompanies, deleteCompany } from '../services/companies';
import { getJobTransactions, deleteTransaction } from '../services/transactions';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportJobDetailToExcel } from '../utils/jobDetailExport';
import AddCompanyModal from '../components/AddCompanyModal';
import AddTransactionModal from '../components/AddTransactionModal';
import EditJobModal from '../components/EditJobModal';

interface JobDetailPageProps {
  jobId: string;
  onBack: () => void;
  onCompanyClick: (companyId: string) => void;
}

type TabType = 'employers' | 'employees' | 'transactions';

export default function JobDetailPage({ jobId, onBack, onCompanyClick }: JobDetailPageProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('employers');
  const [employers, setEmployers] = useState<CompanyWithStats[]>([]);
  const [employees, setEmployees] = useState<CompanyWithStats[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [addCompanyType, setAddCompanyType] = useState<'İşveren' | 'Çalışan'>('İşveren');
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showEditJobModal, setShowEditJobModal] = useState(false);

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  async function loadJobData() {
    setLoading(true);
    try {
      const [jobData, statsData, companiesData, transactionsData] = await Promise.all([
        getJob(jobId),
        calculateJobStats(jobId),
        getJobCompanies(jobId),
        getJobTransactions(jobId),
      ]);
      setJob(jobData);
      setStats(statsData);
      setEmployers(companiesData.filter(c => c.type === 'İşveren'));
      setEmployees(companiesData.filter(c => c.type === 'Çalışan'));
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCompany(companyId: string) {
    if (!confirm('Bu firmayı silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteCompany(companyId);
      loadJobData();
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Firma silinirken bir hata oluştu');
    }
  }

  async function handleDeleteTransaction(transactionId: string) {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteTransaction(transactionId);
      loadJobData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('İşlem silinirken bir hata oluştu');
    }
  }

  function openAddCompanyModal(type: 'İşveren' | 'Çalışan') {
    setAddCompanyType(type);
    setShowAddCompanyModal(true);
  }

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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">İş bulunamadı</p>
          <button
            onClick={onBack}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    Aktif: 'bg-green-600',
    Tamamlandı: 'bg-blue-600',
    Duraklatıldı: 'bg-yellow-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold">{job.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status]}`}>
                {job.status}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportJobDetailToExcel(job, stats, employers, employees, transactions)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                title="Excel'e Aktar"
              >
                <FileDown className="w-5 h-5" />
                <span className="hidden sm:inline">Excel'e Aktar</span>
              </button>
              <button
                onClick={() => setShowEditJobModal(true)}
                className="flex items-center gap-2 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                title="Düzenle"
              >
                <Edit2 className="w-5 h-5" />
                <span className="hidden sm:inline">Düzenle</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{job.name}</h2>
            <p className="text-gray-600">{job.description || 'Açıklama yok'}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
              <span>Başlangıç: {formatDate(job.start_date)}</span>
              {job.end_date && <span>Bitiş: {formatDate(job.end_date)}</span>}
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Toplam Gelir</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Toplam Gider</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Net Durum</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.netBalance)}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Yapılacak Ödeme</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.totalToBePaid)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Kalan Borç</p>
                <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.totalRemaining)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('employers')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === 'employers'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Building2 className="w-5 h-5" />
                İşverenler
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === 'employees'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Users className="w-5 h-5" />
                Çalışanlar
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === 'transactions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Receipt className="w-5 h-5" />
                İşlemler
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'employers' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">İşverenler</h3>
                  <button
                    onClick={() => openAddCompanyModal('İşveren')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    İşveren Ekle
                  </button>
                </div>
                {employers.length > 0 ? (
                  <div className="space-y-4">
                    {employers.map((employer) => (
                      <div
                        key={employer.id}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => onCompanyClick(employer.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-lg">{employer.name}</h4>
                            <div className="grid grid-cols-3 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Gelir</p>
                                <p className="text-sm font-medium text-green-600">
                                  {formatCurrency(employer.employerIncome || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Gider</p>
                                <p className="text-sm font-medium text-red-600">
                                  {formatCurrency(employer.employerExpense || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Durum</p>
                                <p className="text-sm font-medium text-blue-600">
                                  {employer.status}
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCompany(employer.id);
                            }}
                            className="text-red-500 hover:text-red-700 p-2 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Henüz işveren eklenmemiş. Yukarıdaki butona tıklayarak işveren ekleyin.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'employees' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Çalışanlar</h3>
                  <button
                    onClick={() => openAddCompanyModal('Çalışan')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Çalışan Ekle
                  </button>
                </div>
                {employees.length > 0 ? (
                  <div className="space-y-4">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => onCompanyClick(employee.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-lg">{employee.name}</h4>
                            <div className="grid grid-cols-3 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Toplam Alacak</p>
                                <p className="text-sm font-medium text-orange-600">
                                  {formatCurrency(employee.totalReceivable || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Yapılan Ödeme</p>
                                <p className="text-sm font-medium text-green-600">
                                  {formatCurrency(employee.paymentsMade || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Kalan Alacak</p>
                                <p className="text-sm font-medium text-red-600">
                                  {formatCurrency(employee.receivable || 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCompany(employee.id);
                            }}
                            className="text-red-500 hover:text-red-700 p-2 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Henüz çalışan eklenmemiş. Yukarıdaki butona tıklayarak çalışan ekleyin.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">İşlemler</h3>
                  <button
                    onClick={() => setShowAddTransactionModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    İşlem Ekle
                  </button>
                </div>
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Tarih</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">İşlem Yapan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">İşlem Yapılan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Açıklama</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Tip</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Gelir</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Gider</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {transaction.performed_by?.name || '-'}
                              <span className="block text-xs text-gray-500">{transaction.performed_by?.type}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {transaction.company?.name || '-'}
                              <span className="block text-xs text-gray-500">{transaction.company?.type}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              {transaction.description}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {transaction.note}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                              {transaction.income > 0 ? formatCurrency(transaction.income) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                              {transaction.expense > 0 ? formatCurrency(transaction.expense) : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Henüz işlem eklenmemiş. Yukarıdaki butona tıklayarak işlem ekleyin.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {showAddCompanyModal && (
        <AddCompanyModal
          jobId={jobId}
          type={addCompanyType}
          onClose={() => setShowAddCompanyModal(false)}
          onSuccess={() => {
            setShowAddCompanyModal(false);
            loadJobData();
          }}
        />
      )}

      {showAddTransactionModal && (
        <AddTransactionModal
          jobId={jobId}
          onClose={() => setShowAddTransactionModal(false)}
          onSuccess={() => {
            setShowAddTransactionModal(false);
            loadJobData();
          }}
        />
      )}

      {showEditJobModal && job && (
        <EditJobModal
          job={job}
          onClose={() => setShowEditJobModal(false)}
          onSuccess={() => {
            setShowEditJobModal(false);
            loadJobData();
          }}
        />
      )}
    </div>
  );
}
