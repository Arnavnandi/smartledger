import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import api from '../../services/api';
import type { PaginatedResponse } from '../../types/invoice.types';
import { Activity, ShieldCheck, FileText, Receipt, Users, Sparkles, Clock, Lock, X, Search, Filter } from 'lucide-react';

export interface AuditLog {
  id: number;
  userEmail: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  actionType: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
  status: string;
  timestamp: string;
}

export const ActivityPage = () => {
  const [data, setData] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchActivity();
  }, [page]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const response = await api.get<PaginatedResponse<AuditLog>>(`/activity?page=${page}&size=15`);
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('SAVE')) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    if (action.includes('AI') || action.includes('COPILOT')) return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
    if (action.includes('LOGIN') || action.includes('AUTH') || action.includes('REGISTER')) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
  };

  const getActionIcon = (action: string, entityType?: string) => {
    if (action.includes('LOGIN') || action.includes('AUTH')) return <Lock className="w-4 h-4 text-amber-500" />;
    if (entityType === 'INVOICE' || action.includes('INVOICE')) return <FileText className="w-4 h-4 text-emerald-500" />;
    if (entityType === 'EXPENSE' || action.includes('EXPENSE')) return <Receipt className="w-4 h-4 text-rose-500" />;
    if (entityType === 'CLIENT' || action.includes('CLIENT')) return <Users className="w-4 h-4 text-sky-500" />;
    if (action.includes('AI') || action.includes('COPILOT')) return <Sparkles className="w-4 h-4 text-purple-500" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  const filteredContent = data?.content.filter(log => 
    !search || log.actionType.toLowerCase().includes(search.toLowerCase()) || log.userEmail.toLowerCase().includes(search.toLowerCase()) || (log.description && log.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-5xl mx-auto relative"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-600 dark:from-white dark:via-slate-100 dark:to-indigo-300 bg-clip-text text-transparent flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Enterprise Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time activity timeline tracking authentication, document mutations, before/after JSON states, and AI Copilot queries.
          </p>
        </div>

        <div className="flex items-center space-x-2 relative w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <Input
            placeholder="Filter by user or action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-full sm:w-64"
          />
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-500" /> Activity Records
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Click any activity item to inspect full before/after JSON payloads</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !filteredContent || filteredContent.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-500">No activity logs matching criteria.</p>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-5 pl-6">
              {filteredContent.map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className="relative group cursor-pointer"
                >
                  <div className="absolute -left-[35px] top-0.5 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-sm">
                    {getActionIcon(log.actionType, log.entityType)}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3.5 space-y-1 hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] font-bold uppercase border ${getActionBadgeColor(log.actionType)}`}>
                          {log.actionType}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{log.userEmail}</span>
                        {log.userRole && (
                          <span className="text-[10px] text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">{log.userRole}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-sans pt-1">
                      {log.description || `Action ${log.actionType} on ${log.entityType || 'Resource'} ${log.entityId || ''}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Page <strong className="text-slate-800 dark:text-slate-200">{data.currentPage + 1}</strong> of <strong className="text-slate-800 dark:text-slate-200">{data.totalPages}</strong>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={data.currentPage === 0} className="h-8 text-xs rounded-lg">
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={data.currentPage === data.totalPages - 1} className="h-8 text-xs rounded-lg">
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side Details Drawer for Before/After JSON inspection */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl font-sans"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" /> Audit Log Inspector
                </h3>
                <p className="text-[10px] text-slate-400">Event #{selectedLog.id} &bull; {new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} className="h-8 w-8 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">User</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{selectedLog.userEmail}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Action</span>
                  <p className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedLog.actionType}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">IP Address</span>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{selectedLog.ipAddress || '127.0.0.1'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{selectedLog.status}</p>
                </div>
              </div>

              {selectedLog.oldValue && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Previous State (oldValue)</span>
                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-48">
                    {selectedLog.oldValue}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Updated State (newValue)</span>
                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-48">
                    {selectedLog.newValue}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button size="sm" onClick={() => setSelectedLog(null)} className="w-full h-9 text-xs rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
                Close Inspector
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
