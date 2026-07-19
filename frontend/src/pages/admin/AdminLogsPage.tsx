import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import type { AuditLog } from '../../services/admin.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const AdminLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getLogs(page, 50);
      setLogs(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const getActionBadge = (action: string) => {
    if (action.includes('CREATED') || action.includes('REGISTERED')) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{action}</Badge>;
    }
    if (action.includes('DELETED')) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{action}</Badge>;
    }
    if (action.includes('UPDATE')) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{action}</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Immutable record of critical system events.</p>
      </div>

      <div className="border rounded-md bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10">Loading logs...</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10">No audit logs found.</TableCell></TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{log.userEmail}</TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                      {log.resourceType} #{log.resourceId}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.details}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </Button>
          <div className="text-sm">Page {page + 1} of {totalPages}</div>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
