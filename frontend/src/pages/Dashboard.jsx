import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, escalated: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/requests/')
      .then(({ data }) => {
        const counts = { pending: 0, approved: 0, rejected: 0, escalated: 0 }
        data.forEach((r) => {
          const key = r.status.toLowerCase()
          if (key in counts) counts[key]++
        })
        setStats(counts)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Pending', value: stats.pending, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    { label: 'Approved', value: stats.approved, color: 'bg-green-50 border-green-200 text-green-700' },
    { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 border-red-200 text-red-700' },
    { label: 'Escalated', value: stats.escalated, color: 'bg-purple-50 border-purple-200 text-purple-700' },
  ]

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || 'User'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's a summary of your approval requests.</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/submit" className="card hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Submit New Request</h3>
          <p className="text-sm text-gray-500 mt-1">Create a room booking, access permission, or equipment request.</p>
        </Link>

        <Link to="/my-requests" className="card hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">My Requests</h3>
          <p className="text-sm text-gray-500 mt-1">Track the status of your submitted requests.</p>
        </Link>

        {profile?.role === 'admin' && (
          <Link to="/approvals" className="card hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Approval Queue</h3>
            <p className="text-sm text-gray-500 mt-1">Review and act on pending requests.</p>
          </Link>
        )}
      </div>

      {/* Risk info panel */}
      <div className="mt-8 card bg-blue-50 border-blue-200">
        <h2 className="font-semibold text-blue-800 mb-2">🤖 How Risk Classification Works</h2>
        <p className="text-sm text-blue-700">
          Every request is automatically scored by our rule-based engine.{' '}
          <strong>Low-risk</strong> requests are auto-approved instantly.{' '}
          <strong>Medium</strong> and <strong>High-risk</strong> requests are escalated to an administrator for manual review.
        </p>
      </div>
    </div>
  )
}
