import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import type { AdminUserResponse } from '../../services/admin.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(page, 20);
      setUsers(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">View all registered users on the platform.</p>
      </div>

      <div className="border rounded-md bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">No users found.</TableCell></TableRow>
            ) : (
              users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'ADMIN' ? 'destructive' : 'default'}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.isEmailVerified 
                      ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
                      : <Badge variant="secondary">Pending</Badge>}
                  </TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
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
