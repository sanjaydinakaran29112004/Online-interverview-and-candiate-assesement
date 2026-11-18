import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { ShieldCheck, Calendar, Clock, Terminal } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await adminAPI.getAuditLogs();
        if (res.data.success) {
          setLogs(res.data.logs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security & Activity Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable event log tracing system registrations, interview actions, evaluations, and administrative changes
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading audit trail...</div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action Event</th>
                  <th className="px-6 py-3.5">Initiator</th>
                  <th className="px-6 py-3.5">Entity</th>
                  <th className="px-6 py-3.5">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-indigo-700">
                      {log.action}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      {log.user ? `${log.user.name} (${log.user.role})` : 'System Daemon'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {log.entity}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-sans text-xs">
                      {log.details || 'Operational event'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
