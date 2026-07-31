import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { expenseService } from '../../services/expense.service';
import type { Expense } from '../../types/expense.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '../../components/shared/EmptyState';
import { AlertCircle, FileText, Trash2, Plus, Filter, Receipt, Search } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';

export const ExpensesListPage = () => {
  const { formatCurrency } = useCompany();
  const navigate = useNavigate();
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-600 dark:from-white dark:via-slate-100 dark:to-indigo-300 bg-clip-text text-transparent">
            Expenses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Track business expenditure, vendor payments, and category receipts.</p>
        </div>
        <Link to="/expenses/new">
          <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-glow-indigo flex items-center gap-1.5 transition-all transform active:scale-95">
            <Plus className="w-4 h-4" /> Log Expense
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 max-w-sm sm:max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <Input 
          placeholder="Search vendors..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-9 text-xs rounded-xl flex items-center gap-1.5 border-slate-200 dark:border-slate-800 shrink-0"
        >
          <Filter className="w-3.5 h-3.5" /> Filters
        </Button>
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
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Date</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Vendor</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300">Category</TableHead>
              <TableHead className="font-semibold text-xs text-slate-600 dark:text-slate-300 text-right">Amount</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0 border-none">
                  <EmptyState
                    icon={Receipt}
                    title="No expenses logged"
                    description={search ? `No vendor match found for "${search}".` : 'Keep track of company expenses by adding your first record.'}
                    actionLabel="Log Expense"
                    onAction={() => navigate('/expenses/new')}
                  />
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} className={`odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/80 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors border-b border-slate-100 dark:border-slate-800/50 ${expense.isDuplicate ? "bg-rose-50/50 dark:bg-rose-950/20" : ""}`}>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-medium">{expense.expenseDate}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{expense.vendorName}</div>
                    {expense.isDuplicate && (
                      <div className="text-[10px] text-rose-600 dark:text-rose-400 flex items-center mt-0.5 font-semibold">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Potential Duplicate
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span 
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold"
                      style={expense.categoryColor ? { backgroundColor: expense.categoryColor + '20', color: expense.categoryColor, borderColor: expense.categoryColor } : {}}
                    >
                      {expense.categoryName || 'Uncategorized'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-extrabold text-xs text-rose-600 dark:text-rose-400">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {expense.receiptUrl && (
                        <a href={expense.receiptUrl.startsWith('http') ? expense.receiptUrl : `${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${expense.receiptUrl}`} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40" title="View Receipt">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40">
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
    </motion.div>
  );
};
