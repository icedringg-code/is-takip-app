import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getJobCompanies } from '../services/companies';
import {
  createEmployeeReceivable,
  createEmployerIncome,
  createEmployerExpense,
  createPaymentToEmployee,
} from '../services/transactions';
import { CompanyWithStats } from '../types';

interface AddTransactionModalProps {
  jobId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type TransactionType = 'employee_receivable' | 'employer_income' | 'employer_expense' | 'payment_to_employee';

export default function AddTransactionModal({ jobId, onClose, onSuccess }: AddTransactionModalProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>('employee_receivable');
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [employers, setEmployers] = useState<CompanyWithStats[]>([]);
  const [employees, setEmployees] = useState<CompanyWithStats[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedEmployerId, setSelectedEmployerId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompanies();
  }, [jobId]);

  async function loadCompanies() {
    try {
      const companiesData = await getJobCompanies(jobId);
      setCompanies(companiesData);
      setEmployers(companiesData.filter(c => c.type === 'İşveren'));
      setEmployees(companiesData.filter(c => c.type === 'Çalışan'));
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Geçerli bir tutar girin');
      return;
    }

    if (!description.trim()) {
      setError('Açıklama gereklidir');
      return;
    }

    setLoading(true);

    try {
      switch (transactionType) {
        case 'employee_receivable':
          if (!selectedCompanyId) {
            setError('Çalışan seçin');
            return;
          }
          await createEmployeeReceivable({
            jobId,
            companyId: selectedCompanyId,
            amount: amountNum,
            description: description.trim(),
            date,
          });
          break;

        case 'employer_income':
          if (!selectedCompanyId) {
            setError('İşveren seçin');
            return;
          }
          await createEmployerIncome({
            jobId,
            companyId: selectedCompanyId,
            amount: amountNum,
            description: description.trim(),
            date,
          });
          break;

        case 'employer_expense':
          if (!selectedCompanyId) {
            setError('İşveren seçin');
            return;
          }
          await createEmployerExpense({
            jobId,
            companyId: selectedCompanyId,
            amount: amountNum,
            description: description.trim(),
            date,
          });
          break;

        case 'payment_to_employee':
          if (!selectedEmployerId || !selectedEmployeeId) {
            setError('İşveren ve çalışan seçin');
            return;
          }
          await createPaymentToEmployee({
            jobId,
            employerId: selectedEmployerId,
            employeeId: selectedEmployeeId,
            amount: amountNum,
            description: description.trim(),
            date,
          });
          break;
      }

      onSuccess();
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError('İşlem eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  const transactionTypes = [
    { value: 'employee_receivable' as const, label: 'Çalışan Alacağı' },
    { value: 'employer_income' as const, label: 'İşveren Geliri' },
    { value: 'employer_expense' as const, label: 'İşveren Harcaması' },
    { value: 'payment_to_employee' as const, label: 'Çalışana Ödeme' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">İşlem Ekle</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşlem Tipi
            </label>
            <select
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value as TransactionType);
                setSelectedCompanyId('');
                setSelectedEmployerId('');
                setSelectedEmployeeId('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              {transactionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {transactionType === 'employee_receivable' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Çalışan
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              >
                <option value="">Çalışan seçin</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(transactionType === 'employer_income' || transactionType === 'employer_expense') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İşveren
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              >
                <option value="">İşveren seçin</option>
                {employers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {transactionType === 'payment_to_employee' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Yapan İşveren
                </label>
                <select
                  value={selectedEmployerId}
                  onChange={(e) => setSelectedEmployerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">İşveren seçin</option>
                  {employers.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Alan Çalışan
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">Çalışan seçin</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tutar (₺)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İşlem açıklaması"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
