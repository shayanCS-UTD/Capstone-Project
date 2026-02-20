import StatusBadge from './StatusBadge'
import RiskBadge from './RiskBadge'

export default function RequestCard({ request }) {
  const typeLabels = {
    room_booking: 'Room Booking',
    access_permission: 'Access Permission',
    equipment_checkout: 'Equipment Checkout',
    other: 'Other',
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{request.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{typeLabels[request.request_type] || request.request_type}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RiskBadge level={request.risk_level} />
          <StatusBadge status={request.status} />
        </div>
      </div>

      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{request.description}</p>

      {request.risk_factors?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {request.risk_factors.map((factor) => (
            <span key={factor} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200">
              {factor}
            </span>
          ))}
        </div>
      )}

      {request.decision_reason && (
        <p className="mt-3 text-xs text-gray-500 italic">
          Decision: {request.decision_reason}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span>Risk score: <strong className="text-gray-600">{request.risk_score}/100</strong></span>
        <span>{new Date(request.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
