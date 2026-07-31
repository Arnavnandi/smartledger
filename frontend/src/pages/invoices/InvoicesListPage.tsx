import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { invoiceService } from '../../services/invoice.service';
import type { Invoice, PaginatedResponse } from '../../types/invoice.types';
import { useCompany } from '../../context/CompanyContext';
import { FileText, Plus, Filter, MoreHorizontal } from 'lucide-react';

export const InvoicesListPage = () => {
  const { formatCurrency } = useCompany();
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<Invoice> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const size = 10;

  const [advancedFilters, setAdvancedFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let hasAdvanced = advancedFilters.startDate || advancedFilters.endDate || advancedFilters.minAmount || advancedFilters.maxAmount;
      if (hasAdvanced) {
        const filterPayload = {
          search,
          status: statusFilter === 'ALL' ? null : statusFilter,
          startDate: advancedFilters.startDate || null,
          endDate: advancedFilters.endDate || null,
          minAmount: advancedFilters.minAmount ? Number(advancedFilters.minAmount) : null,
          maxAmount: advancedFilters.maxAmount ? Number(advancedFilters.maxAmount) : null
        };
        const result = await invoiceService.searchInvoices(page, size, filterPayload);
        setData(result);
      } else {
        const result = await invoiceService.getInvoices(page, size, search, statusFilter);
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, page, advancedFilters]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await invoiceService.deleteInvoice(id);
      fetchInvoices();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">Paid</Badge>;
      case 'PENDING': return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">Pending</Badge>;
      case 'OVERDUE': return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">Overdue</Badge>;
      case 'DRAFT': return <Badge variant="secondary">Draft</Badge>;
      case 'CANCELLED': return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
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
            Invoices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage billing, client payments, and track status.</p>
        </div>
        <Link to="/invoices/new">
          <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-glow-indigo flex items-center gap-1.5 transition-all transform active:scale-95">
            <Plus className="w-4 h-4" /> Create Invoice
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Tabs value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(0); }}>
          <TabsList className="bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl">
            <TabsTrigger value="ALL" className="text-xs rounded-lg">All</TabsTrigger>
            <TabsTrigger value="DRAFT" className="text-xs rounded-lg">Draft</TabsTrigger>
            <TabsTrigger value="PENDING" className="text-xs rounded-lg">Pending</TabsTrigger>
            <TabsTrigger value="PAID" className="text-xs rounded-lg">Paid</TabsTrigger>
            <TabsTrigger value="OVERDUE" className="text-xs rounded-lg">Overdue</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search invoice # or client..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="flex-1 sm:w-64 h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="h-9 text-xs rounded-xl flex items-center gap-1.5 border-slate-200 dark:border-slate-800"
          >
            <Filter className="w-3.5 h-3.5" /> Filters
          </Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Start Date</label>
            <Input type="date" value={advancedFilters.startDate} onChange={e => setAdvancedFilters({...advancedFilters, startDate: e.target.value})} className="h-8 text-xs rounded-lg" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">End Date</label>
            <Input type="date" value={advancedFilters.endDate} onChange={e => setAdvancedFilters({...advancedFilters, endDate: e.target.value})} className="h-8 text-xs rounded-lg" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Min Amount</label>
            <Input type="number" placeholder="0.00" value={advancedFilters.minAmount} onChange={e => setAdvancedFilters({...advancedFilters, minAmount: e.target.value})} className="h-8 text-xs rounded-lg" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Max Amount</label>
            <Input type="number" placeholder="1000.00" value={advancedFilters.maxAmount} onChange={e => setAdvancedFilters({...advancedFilters, maxAmount: e.target.value})} className="h-8 text-xs rounded-lg" />
          </div>
        </div>
      )}

      <div className="border rounded-2xl bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-100/80 dark:bg-slate-800/50 sticky top-0 backdrop-blur z-10">
            <TableRow className="border-b border-slate-200 dark:border-slate-800">
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Invoice #</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Client</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Issue Date</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Due Date</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Amount</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Status</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : data?.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0 border-none">
                  <EmptyState
                    icon={FileText}
                    title="No invoices found"
                    description={search ? `No invoice matches "${search}". Try resetting filters.` : 'You haven\'t created any invoices yet.'}
                    actionLabel="Create Invoice"
                    onAction={() => navigate('/invoices/new')}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data?.content.map((invoice) => (
                <TableRow key={invoice.id} className="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/80 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors border-b border-slate-100 dark:border-slate-800/50">
                  <TableCell className="font-medium text-xs">
                    <Link to={`/invoices/${invoice.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400 font-bold">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link to={`/clients/${invoice.clientId}`} className="hover:underline text-slate-800 dark:text-slate-200 font-medium">
                      {invoice.clientName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 dark:text-slate-400">{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs text-slate-500 dark:text-slate-400">{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-bold text-xs text-slate-900 dark:text-slate-100">{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs">
                        <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        {invoice.status === 'DRAFT' && (
                          <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                            Edit Draft
                          </DropdownMenuItem>
                        )}
                        {invoice.status === 'DRAFT' && (
                          <DropdownMenuItem className="text-rose-600 dark:text-rose-400" onClick={() => handleDelete(invoice.id)}>
                            Delete
                          </DropdownMenuItem>
                        )}
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
