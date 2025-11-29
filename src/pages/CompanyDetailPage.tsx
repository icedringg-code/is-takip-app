import { useEffect, useState } from 'react';
import { ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react';
import { Company } from '../types';
import { getCompany, updateCompany, deleteCompany } from '../services/companies';
import { getCompanyTransactions, deleteTransaction } from '../services/transactions';
import { formatCurrency, formatDate } from '../utils/formatters';
import AddTransactionModal from '../components/AddTransactionModal';

interface CompanyDetailPageProps {
  companyId: string;
  jobId: string;
  onBack: () => void;
}

export default function CompanyDetailPage({ companyId, jobId, onBack }: CompanyDetailPageProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  useEffect(() => {
    loadCompanyData();
  }, [companyId]);

  async function loadCompanyData() {
    setLoading(true);
    try {
      const [companyData, transactionsData] = await Promise.all([
        getCompany(companyId),
        getCompanyTransactions(companyId),
      ]);

      setCompany(companyData);
      setTransactions(transactionsData);
      setEditName(companyData?.name || '');

      const totalIncome = transactionsData
        .filter(t => t.company_id === companyId)
        .reduce((sum, t) => sum + Number(t.income), 0);

      const totalExpense = transactionsData
        .filter(t => t.company_id === companyId)
        .reduce((sum, t) => sum + Number(t.expense), 0);

      setStats({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      });
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!company || !editName.trim()) return;

    try {
      await updateCompany(companyId, { name: editName.trim() });
      setIsEditing(false);
      loadCompanyData();
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Firma güncellenirken bir hata oluştu');
    }
  }

  async function handleDelete() {
    if (!confirm('Bu firmayı silmek istediğinizden emin misiniz? Tüm işlemler de silinecektir.')) return;

    try {
      await deleteCompany(companyId);
      onBack();
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Firma silinirken bir hata oluştu');
    }
  }

  async function handleDeleteTransaction(transactionId: string) {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteTransaction(transactionId);
      loadCompanyData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('İşlem silinirken bir hata oluştu');
    }
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

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Firma bulunamadı</p>
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

  const typeColors = {
    'İşveren': 'bg-blue-600',
    'Çalışan': 'bg-green-600',
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
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xl font-bold bg-gray-700 px-3 py-1 rounded"
                  autoFocus
                />
              ) : (
                <h1 className="text-xl font-bold">{company.name}</h1>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColors[company.type]}`}>
                {company.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Kaydet
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
                    title="Sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Toplam Gelir</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Toplam Gider</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Bakiye</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.balance)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">İşlemler</h2>
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
      </main>

      {showAddTransactionModal && (
        <AddTransactionModal
          jobId={jobId}
          onClose={() => setShowAddTransactionModal(false)}
          onSuccess={() => {
            setShowAddTransactionModal(false);
            loadCompanyData();
          }}
        />
      )}
    </div>
  );
}
