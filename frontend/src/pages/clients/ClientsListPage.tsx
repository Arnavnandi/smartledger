import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { clientService } from '../../services/client.service';
import type { Client, PaginatedResponse } from '../../types/client.types';
import { useCompany } from '../../context/CompanyContext';
import { Users, Plus, Search, MoreHorizontal } from 'lucide-react';

export const ClientsListPage = () => {
  const { formatCurrency } = useCompany();
  const navigate = useNavigate();
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-600 dark:from-white dark:via-slate-100 dark:to-indigo-300 bg-clip-text text-transparent">
            Clients Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage client records, billing contacts, and balance totals.</p>
        </div>
        <Link to="/clients/new">
          <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-glow-indigo flex items-center gap-1.5 transition-all transform active:scale-95">
            <Plus className="w-4 h-4" /> Add Client
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2 max-w-sm relative">
        <Search className="w-4 h-4 absolute left-3 text-slate-400" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        />
      </div>

      <div className="border rounded-2xl bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-100/80 dark:bg-slate-800/50 sticky top-0 backdrop-blur z-10">
            <TableRow className="border-b border-slate-200 dark:border-slate-800">
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Name</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Email</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Outstanding Balance</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Tags</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : data?.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0 border-none">
                  <EmptyState
                    icon={Users}
                    title="No clients found"
                    description={search ? `No client matches "${search}".` : 'Get started by adding your first client account.'}
                    actionLabel="Add Client"
                    onAction={() => navigate('/clients/new')}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data?.content.map((client) => (
                <TableRow key={client.id} className="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/80 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors border-b border-slate-100 dark:border-slate-800/50">
                  <TableCell className="font-medium text-xs">
                    <Link to={`/clients/${client.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400 font-bold">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-400">{client.email}</TableCell>
                  <TableCell className={`font-bold text-xs ${client.outstandingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {formatCurrency(client.outstandingBalance)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {client.tags?.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800">{tag}</Badge>
                      ))}
                      {client.tags?.length > 2 && <Badge variant="outline" className="text-[10px]">+{client.tags.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs">
                        <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/edit`)}>
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-600 dark:text-rose-400" onClick={() => handleDelete(client.id)}>
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
      
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing page <strong className="text-slate-800 dark:text-slate-200">{data.currentPage + 1}</strong> of <strong className="text-slate-800 dark:text-slate-200">{data.totalPages}</strong>
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
    </motion.div>
  );
};
