import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '../../components/shared/AnimatedCounter';
import { EmptyState } from '../../components/shared/EmptyState';
import { reportService } from '../../services/reports.service';
import type { ReportSummaryResponse } from '../../services/reports.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, FileSpreadsheet, PieChart, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ReportsPage = () => {
  const { formatCurrency } = useCompany();
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState<ReportSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [viewType, year, month]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let data;
      if (viewType === 'monthly') {
        data = await reportService.getMonthlyReport(year, month);
      } else {
        data = await reportService.getYearlyReport(year);
      }
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'json') => {
    if (viewType === 'monthly') {
      reportService.exportReport(format, year, month);
    } else {
      reportService.exportReport(format, year);
    }
  };

  const isPositive = (report?.netProfit || 0) >= 0;

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
            Financial Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Comprehensive breakdown of business income, expenses, and net profit margins.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-glow-indigo gap-1.5 transition-all transform active:scale-95 cursor-pointer outline-none">
              <Download className="w-4 h-4" /> Export Report
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2 text-rose-500" /> Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2 text-indigo-500" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileText className="w-4 h-4 mr-2 text-purple-500" /> Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Controls */}
      <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <Button 
              variant={viewType === 'monthly' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('monthly')}
              className={`text-xs h-8 rounded-lg ${viewType === 'monthly' ? 'bg-indigo-600 text-white shadow-sm' : ''}`}
            >
              Monthly View
            </Button>
            <Button 
              variant={viewType === 'yearly' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('yearly')}
              className={`text-xs h-8 rounded-lg ${viewType === 'yearly' ? 'bg-indigo-600 text-white shadow-sm' : ''}`}
            >
              Yearly View
            </Button>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="flex h-9 w-full sm:w-32 items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {viewType === 'monthly' && (
              <select 
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="flex h-9 w-full sm:w-36 items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {Array.from({length: 12}).map((_, i) => (
                  <option key={i+1} value={i+1}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 border-t-4 border-t-emerald-500 rounded-2xl shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  <AnimatedCounter value={report.totalRevenue} formatter={(val) => formatCurrency(val)} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 border-t-4 border-t-rose-500 rounded-2xl shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expenses</CardTitle>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                  <AnimatedCounter value={report.totalExpenses} formatter={(val) => formatCurrency(val)} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 border-t-4 border-t-indigo-500 rounded-2xl shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Profit</CardTitle>
                {isPositive ? <TrendingUp className="w-4 h-4 text-indigo-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-extrabold ${isPositive ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  <AnimatedCounter value={report.netProfit} formatter={(val) => formatCurrency(val)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Income vs Expenses Breakdown</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Comparing total billed revenue against logged expense items over {report.period}</CardDescription>
            </CardHeader>
            <CardContent>
              {report.breakdown.length === 0 ? (
                <EmptyState
                  icon={PieChart}
                  title="No breakdown data available"
                  description="No recorded revenue or expense activity found for the selected period."
                />
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.breakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-[#334155]" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis width={85} stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#f8fafc',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
                        }}
                        formatter={(val: any, name: any) => [
                          formatCurrency(Number(val)),
                          name === 'revenue' || name === 'Revenue' ? 'Revenue' : 'Expense'
                        ]}
                      />
                      <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                      <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} minPointSize={4} />
                      <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} minPointSize={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </motion.div>
  );
};
