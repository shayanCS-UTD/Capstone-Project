export default function RiskBadge({ level, score }) {
  const styles = {
    LOW:    'bg-green-50 text-green-700 border-green-200',
    MEDIUM: 'bg-orange-50 text-orange-700 border-orange-200',
    HIGH:   'bg-red-50 text-red-700 border-red-200',
  }

  const icons = {
    LOW:    '▼',
    MEDIUM: '◆',
    HIGH:   '▲',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[level] || 'bg-gray-100 text-gray-600'}`}>
      <span>{icons[level] || ''}</span>
      {level}{score !== undefined ? ` (${score})` : ''}
    </span>
  )
}
