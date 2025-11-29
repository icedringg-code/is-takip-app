export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return '-';

  try {
    return new Date(date).toLocaleDateString('tr-TR');
  } catch {
    return date;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Aktif':
      return 'green';
    case 'Tamamlandı':
      return 'blue';
    case 'Duraklatıldı':
      return 'yellow';
    default:
      return 'gray';
  }
}
