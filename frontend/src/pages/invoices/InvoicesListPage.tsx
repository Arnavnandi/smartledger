import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { invoiceService } from '../../services/invoice.service';
import type { Invoice, PaginatedResponse } from '../../types/invoice.types';
import { useCompany } from '../../context/CompanyContext';

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
      case 'PAID': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'PENDING': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending</Badge>;
      case 'OVERDUE': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      case 'DRAFT': return <Badge variant="secondary">Draft</Badge>;
      case 'CANCELLED': return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage your billing and invoices.</p>
        </div>
        <Link to="/invoices/new">
          <Button>Create Invoice</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Tabs value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(0); }}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="DRAFT">Draft</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="PAID">Paid</TabsTrigger>
            <TabsTrigger value="OVERDUE">Overdue</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search by invoice number or client..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="flex-1 sm:w-64"
          />
          <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)}>
            Filters
          </Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="p-4 border rounded-md bg-muted/20 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium">Start Date</label>
            <Input type="date" value={advancedFilters.startDate} onChange={e => setAdvancedFilters({...advancedFilters, startDate: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">End Date</label>
            <Input type="date" value={advancedFilters.endDate} onChange={e => setAdvancedFilters({...advancedFilters, endDate: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Min Amount</label>
            <Input type="number" placeholder="0.00" value={advancedFilters.minAmount} onChange={e => setAdvancedFilters({...advancedFilters, minAmount: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Max Amount</label>
            <Input type="number" placeholder="1000.00" value={advancedFilters.maxAmount} onChange={e => setAdvancedFilters({...advancedFilters, maxAmount: e.target.value})} />
          </div>
        </div>
      )}

      <div className="border rounded-md bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">Loading...</TableCell>
              </TableRow>
            ) : data?.content.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">No invoices found.</TableCell>
              </TableRow>
            ) : (
              data?.content.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <Link to={`/invoices/${invoice.id}`} className="hover:underline text-primary">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`/clients/${invoice.clientId}`} className="hover:underline">
                      {invoice.clientName}
                    </Link>
                  </TableCell>
                  <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-muted">
                        <span className="sr-only">Open menu</span>
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                          <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        {invoice.status === 'DRAFT' && (
                          <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                            Edit Draft
                          </DropdownMenuItem>
                        )}
                        {invoice.status === 'DRAFT' && (
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(invoice.id)}>
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
