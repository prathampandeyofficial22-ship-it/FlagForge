import { useState, useEffect } from 'react';
import { History, Eye, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { AuditLogItem } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';

export function AuditLogs() {
  const { currentOrg } = useAuth();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const loadLogs = async (p = 1) => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs(currentOrg.id, p);
      setLogs(data.logs || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(page);
  }, [currentOrg?.id, page]);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('kill_switched')) return 'rose';
    if (action.includes('toggled') || action.includes('updated')) return 'amber';
    if (action.includes('created')) return 'emerald';
    return 'zinc';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-400" />
            Audit Trail
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Immutable, append-only record of all configuration changes and release operations
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Cryptographically Verified</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-surface-900 border border-border-dark rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            No audit records found for this workspace.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-dark bg-surface-950/50 text-zinc-400 font-medium">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Resource</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-surface-800/50 transition-colors">
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-medium text-zinc-200">{log.entityName}</span>
                        <p className="text-[10px] text-zinc-500 uppercase">{log.entityType}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">
                      {log.actorEmail}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        onClick={() => setSelectedLog(log)}
                        variant="ghost"
                        size="xs"
                        title="View change snapshot"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border-dark bg-surface-950/40 text-xs">
            <span className="text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Diff Modal */}
      <Dialog
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Change Snapshot"
        description={`${selectedLog?.action} on ${selectedLog?.entityName} (${selectedLog?.entityType})`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-medium text-zinc-400">Before Change</span>
              <pre className="p-3 bg-surface-950 border border-border-dark rounded text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-56">
                {selectedLog?.beforeSnapshot
                  ? JSON.stringify(selectedLog.beforeSnapshot, null, 2)
                  : 'null (Initial Creation)'}
              </pre>
            </div>
            <div className="space-y-1">
              <span className="font-medium text-zinc-400">After Change</span>
              <pre className="p-3 bg-surface-950 border border-border-dark rounded text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-56">
                {selectedLog?.afterSnapshot
                  ? JSON.stringify(selectedLog.afterSnapshot, null, 2)
                  : 'null'}
              </pre>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-border-dark">
            <Button onClick={() => setSelectedLog(null)}>Close</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
