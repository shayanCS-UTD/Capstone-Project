import { useEffect, useState } from 'react'
import api from '../lib/api'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'

export default function ApprovalQueue() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionState, setActionState] = useState({}) // { [id]: { loading, reason, showReject } }

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/requests')
      setRequests(data)
    } catch {
      setError('Failed to load the approval queue.')
    } finally {
      setLoading(false)
    }
  }

  function getAction(id) {
    return actionState[id] || { loading: false, reason: '', showReject: false }
  }

  function setAction(id, patch) {
    setActionState((prev) => ({ ...prev, [id]: { ...getAction(id), ...patch } }))
  }

  async function approve(id) {
    setAction(id, { loading: true })
    try {
      await api.put(`/admin/requests/${id}/approve`, { reason: '' })
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch {
      setAction(id, { loading: false })
      alert('Approval failed. Please try again.')
    }
  }

  async function reject(id) {
    const { reason } = getAction(id)
    if (!reason?.trim()) {
      alert('Please enter a rejection reason.')
      return
    }
    setAction(id, { loading: true })
    try {
      await api.put(`/admin/requests/${id}/reject`, { reason })
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch {
      setAction(id, { loading: false })
      alert('Rejection failed. Please try again.')
    }
  }

  const typeLabels = {
    room_booking: 'Room Booking',
    access_permission: 'Access Permission',
    equipment_checkout: 'Equipment Checkout',
    other: 'Other',
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
          <p className="text-gray-500 text-sm mt-1">
            {requests.length} request{requests.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        <button onClick={fetchRequests} className="btn-secondary text-sm">
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="card text-center py-12">
          <svg className="w-12 h-12 text-green-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-sm">All caught up! No pending requests.</p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((r) => {
            const act = getAction(r.id)
            return (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{r.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{typeLabels[r.request_type] || r.request_type} · {r.requester_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={r.risk_level} score={r.risk_score} />
                    <StatusBadge status={r.status} />
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-3">{r.description}</p>

                {r.risk_factors?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.risk_factors.map((f) => (
                      <span key={f} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200">
                        ⚠ {f}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                  {act.showReject && (
                    <div>
                      <label className="label">Rejection reason</label>
                      <textarea
                        className="input-field resize-none"
                        rows={2}
                        value={act.reason}
                        onChange={(e) => setAction(r.id, { reason: e.target.value })}
                        placeholder="Provide a reason for rejection…"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => approve(r.id)}
                      disabled={act.loading}
                      className="btn-primary text-sm"
                    >
                      {act.loading ? '…' : '✓ Approve'}
                    </button>

                    {!act.showReject ? (
                      <button
                        onClick={() => setAction(r.id, { showReject: true })}
                        disabled={act.loading}
                        className="btn-danger text-sm"
                      >
                        ✗ Reject
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => reject(r.id)}
                          disabled={act.loading || !act.reason?.trim()}
                          className="btn-danger text-sm"
                        >
                          {act.loading ? '…' : 'Confirm Reject'}
                        </button>
                        <button
                          onClick={() => setAction(r.id, { showReject: false, reason: '' })}
                          className="btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Submitted {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
