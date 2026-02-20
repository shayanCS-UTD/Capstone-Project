import { useEffect, useState } from 'react'
import api from '../lib/api'

const ACTION_STYLES = {
  SUBMITTED: 'bg-blue-100 text-blue-700',
  AUTO_APPROVED: 'bg-green-100 text-green-700',
  ESCALATED: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/logs/')
      .then(({ data }) => setLogs(data))
      .catch(() => setError('Failed to load activity logs.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Audit trail of all actions in the system.</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-sm">No activity logs yet.</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Performed By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Request ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.performed_by}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{log.performed_by_role}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs truncate max-w-[120px]" title={log.request_id}>
                      {log.request_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {log.details ? (
                        <span title={JSON.stringify(log.details, null, 2)} className="cursor-help underline decoration-dotted">
                          {log.details.reason || log.details.risk_level || JSON.stringify(log.details).slice(0, 40)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
