import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import RiskBadge from '../components/RiskBadge'
import StatusBadge from '../components/StatusBadge'

const REQUEST_TYPES = [
  { value: 'room_booking', label: 'Room Booking' },
  { value: 'access_permission', label: 'Access Permission' },
  { value: 'equipment_checkout', label: 'Equipment Checkout' },
  { value: 'other', label: 'Other' },
]

export default function SubmitRequest() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [requestType, setRequestType] = useState('room_booking')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/requests/', {
        title,
        request_type: requestType,
        description,
      })
      setResult(data)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Request Submitted!</h2>
          <p className="text-gray-500 text-sm mt-1 mb-6">Your request has been processed by our risk engine.</p>

          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Title</span>
              <span className="text-sm font-medium text-gray-900">{result.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <StatusBadge status={result.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Risk Level</span>
              <RiskBadge level={result.risk_level} score={result.risk_score} />
            </div>
            {result.risk_factors?.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">Risk Factors</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.risk_factors.map((f) => (
                    <span key={f} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.decision_reason && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Note</span>
                <span className="text-sm text-gray-700">{result.decision_reason}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => setResult(null)} className="btn-secondary">
              Submit Another
            </button>
            <button onClick={() => navigate('/my-requests')} className="btn-primary">
              View My Requests
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit a Request</h1>
        <p className="text-gray-500 text-sm mt-1">Your request will be automatically risk-assessed.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="label">Request Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Book Conference Room B for Monday"
              minLength={3}
              maxLength={200}
            />
          </div>

          <div>
            <label className="label">Request Type</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="input-field"
            >
              {REQUEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              rows={5}
              placeholder="Describe your request in detail…"
              minLength={10}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            💡 Tip: requests with keywords like "urgent", "bypass", or "admin" will be flagged as high-risk and escalated for review.
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Submitting…
              </span>
            ) : (
              'Submit Request'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
