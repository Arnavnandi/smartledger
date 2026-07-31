import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '../../services/api';
import type { PaginatedResponse } from '../../types/invoice.types';
import { Activity, ShieldCheck, FileText, Receipt, Users, Sparkles, Clock, Lock } from 'lucide-react';

export interface AuditLog {
  id: number;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  timestamp: string;
}

export const ActivityPage = () => {
  const [data, setData] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

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

  const getActionIcon = (action: string, resourceType: string) => {
    if (action.includes('LOGIN') || action.includes('AUTH')) return <Lock className="w-4 h-4 text-indigo-500" />;
    if (resourceType === 'INVOICE') return <FileText className="w-4 h-4 text-emerald-500" />;
    if (resourceType === 'EXPENSE') return <Receipt className="w-4 h-4 text-rose-500" />;
    if (resourceType === 'CLIENT') return <Users className="w-4 h-4 text-amber-500" />;
    if (action.includes('AI')) return <Sparkles className="w-4 h-4 text-purple-500" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-600 dark:from-white dark:via-slate-100 dark:to-indigo-300 bg-clip-text text-transparent flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Audit Trail & Activity Timeline
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete security event logs tracking invoice creation, expense updates, client edits, AI queries, and user logins.
        </p>
      </div>

      <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Workspace Security Log</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Timestamped immutability records for compliance and RBAC tracking</CardDescription>
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
          ) : data?.content.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-500">No activity logs recorded yet.</p>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6 pl-6">
              {data?.content.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-[35px] top-0.5 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-sm">
                    {getActionIcon(log.action, log.resourceType)}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3.5 space-y-1 hover:border-indigo-500/40 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
                          {log.action}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{log.userEmail}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono pt-1">
                      {log.details || `Resource ${log.resourceType || ''} ID ${log.resourceId || ''}`}
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
    </motion.div>
  );
};
