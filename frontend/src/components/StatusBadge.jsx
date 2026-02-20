export default function StatusBadge({ status }) {
  const styles = {
    PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    APPROVED:  'bg-green-50 text-green-700 border-green-200',
    REJECTED:  'bg-red-50 text-red-700 border-red-200',
    ESCALATED: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  const labels = {
    PENDING:   '● Pending',
    APPROVED:  '✓ Approved',
    REJECTED:  '✗ Rejected',
    ESCALATED: '↑ Escalated',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  )
}
