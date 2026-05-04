type StatusKey = 'paid' | 'pending' | 'overdue' | 'draft' | 'active' | 'inactive' | 'leave'

const LABELS: Record<StatusKey, string> = {
  paid: 'مدفوع',
  pending: 'معلق',
  overdue: 'متأخر',
  draft: 'مسودة',
  active: 'نشط',
  inactive: 'غير نشط',
  leave: 'إجازة',
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
