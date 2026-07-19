import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { clientService } from '../../services/client.service';
import type { Client, PaginatedResponse } from '../../types/client.types';
import { useCompany } from '../../context/CompanyContext';

export const ClientsListPage = () => {
  const { formatCurrency } = useCompany();
  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  const fetchClients = async () => {
    setLoading(true);
    try {
      const result = await clientService.getClients(page, size, search);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await clientService.deleteClient(id);
      fetchClients();
    } catch (error) {
      alert('Failed to delete client');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your business clients and their balances.</p>
        </div>
        <Link to="/clients/new">
          <Button>Add Client</Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0); // Reset page on search
          }}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-md bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">Loading...</TableCell>
              </TableRow>
            ) : data?.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">No clients found.</TableCell>
              </TableRow>
            ) : (
              data?.content.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link to={`/clients/${client.id}`} className="hover:underline text-primary">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell className={`font-medium ${client.outstandingBalance > 0 ? 'text-destructive' : ''}`}>
                    {formatCurrency(client.outstandingBalance)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {client.tags?.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                      {client.tags?.length > 2 && <Badge variant="outline">+{client.tags.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-muted">
                        <span className="sr-only">Open menu</span>
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                          <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.location.href = `/clients/${client.id}`}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/clients/${client.id}/edit`}>
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(client.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Basic Pagination Controls */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {data.currentPage + 1} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={data.currentPage === 0}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={data.currentPage === data.totalPages - 1}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
