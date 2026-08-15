import { useState, useEffect } from 'react';
import { FileText, Search, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { superAdminService, type AuditLogItem } from '@services/superadmin.service';

export default function AuditLogsPage() {
  const [logs,    setLogs]    = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const loadLogs = async () => {
    setLoading(true);
    const data = await superAdminService.getAuditLogs(30);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const filtered = logs.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.actor_name.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">System Auditing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Audit & System Logs</h1>
          <p className="text-sm text-muted-foreground">Track system modifications, administrative events, and security logs.</p>
        </div>

        <Button variant="outline" onClick={loadLogs} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Logs
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card border rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search activity by actor or action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="py-3.5 px-6 text-left">Actor</th>
              <th className="py-3.5 px-4 text-left">Action</th>
              <th className="py-3.5 px-4 text-left">Entity</th>
              <th className="py-3.5 px-4 text-left">Timestamp</th>
              <th className="py-3.5 px-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">Loading audit events…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">No activity logs recorded yet.</td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-6 font-medium text-foreground">{log.actor_name}</td>
                  <td className="py-3.5 px-4 text-foreground">{log.action}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{log.entity_type}</td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs tabular-nums">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Success
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
