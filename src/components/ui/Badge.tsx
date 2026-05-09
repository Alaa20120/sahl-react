type StatusKey = 'paid' | 'pending' | 'overdue' | 'draft' | 'confirmed' | 'partial' | 'active' | 'inactive' | 'leave' | 'returned'

const LABELS: Record<StatusKey, string> = {
  paid: 'مدفوع',
  pending: 'معلق',
  overdue: 'متأخر',
  draft: 'مسودة',
  confirmed: 'مؤكد',
  partial: 'جزئي',
  active: 'نشط',
  inactive: 'غير نشط',
  leave: 'إجازة',
  returned: 'مرتجع',
}

interface Props {
  status: StatusKey
  label?: string
}

export default function StatusBadge({ status, label }: Props) {
  return (
    <span className={`status status-${status}`}>
      {label ?? LABELS[status] ?? status}
    </span>
  )
}
