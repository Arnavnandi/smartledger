import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expenseService } from '../../services/expense.service';
import type { Expense } from '../../types/expense.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, FileText, Trash2 } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';

export const ExpensesListPage = () => {
  const { formatCurrency } = useCompany();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [advancedFilters, setAdvancedFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      let hasAdvanced = advancedFilters.startDate || advancedFilters.endDate || advancedFilters.minAmount || advancedFilters.maxAmount;
      if (hasAdvanced) {
        const filterPayload = {
          search,
          startDate: advancedFilters.startDate || null,
          endDate: advancedFilters.endDate || null,
          minAmount: advancedFilters.minAmount ? Number(advancedFilters.minAmount) : null,
          maxAmount: advancedFilters.maxAmount ? Number(advancedFilters.maxAmount) : null
        };
        const data = await expenseService.searchExpenses(0, 50, filterPayload);
        setExpenses(data.content);
      } else {
        const data = await expenseService.getExpenses(0, 50, search);
        setExpenses(data.content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, advancedFilters]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await expenseService.deleteExpense(id);
      fetchExpenses();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <Link to="/expenses/new">
          <Button>+ New Expense</Button>
        </Link>
      </div>

      <div className="flex gap-2 max-w-sm sm:max-w-md">
        <Input 
          placeholder="Search vendors..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)}>
          Filters
        </Button>
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

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading expenses...</TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No expenses found. Click "+ New Expense" to add one.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} className={expense.isDuplicate ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                  <TableCell>{expense.expenseDate}</TableCell>
                  <TableCell>
                    <div className="font-medium">{expense.vendorName}</div>
                    {expense.isDuplicate && (
                      <div className="text-xs text-red-600 flex items-center mt-1">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Potential Duplicate
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span 
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                      style={expense.categoryColor ? { backgroundColor: expense.categoryColor + '20', color: expense.categoryColor, borderColor: expense.categoryColor } : {}}
                    >
                      {expense.categoryName || 'Uncategorized'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {expense.receiptUrl && (
                        <a href={expense.receiptUrl.startsWith('http') ? expense.receiptUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${expense.receiptUrl}`} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" title="View Receipt">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
