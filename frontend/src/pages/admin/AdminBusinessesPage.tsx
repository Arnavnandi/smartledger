import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import type { AdminCompanyResponse } from '../../services/admin.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export const AdminBusinessesPage = () => {
  const [companies, setCompanies] = useState<AdminCompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCompanies(page, 20);
      setCompanies(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Directory</h1>
        <p className="text-muted-foreground mt-1">View all companies created by users.</p>
      </div>

      <div className="border rounded-md bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Owner Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : companies.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-10">No companies found.</TableCell></TableRow>
            ) : (
              companies.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell className="font-bold">{c.name}</TableCell>
                  <TableCell>{c.ownerEmail}</TableCell>
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
