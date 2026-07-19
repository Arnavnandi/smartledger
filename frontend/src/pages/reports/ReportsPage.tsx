import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reportService } from '../../services/reports.service';
import type { ReportSummaryResponse } from '../../services/reports.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
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

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (viewType === 'monthly') {
      reportService.exportReport(format, year, month);
    } else {
      reportService.exportReport(format, year);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">Analyze your income and expenses.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              <Download className="w-4 h-4 mr-2" /> Export
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" /> Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2" /> Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <div className="flex gap-2 p-1 bg-muted rounded-md">
            <Button 
              variant={viewType === 'monthly' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('monthly')}
            >
              Monthly
            </Button>
            <Button 
              variant={viewType === 'yearly' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setViewType('yearly')}
            >
              Yearly
            </Button>
          </div>
          
          <select 
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="flex h-9 w-full sm:w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {viewType === 'monthly' && (
            <select 
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="flex h-9 w-full sm:w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Array.from({length: 12}).map((_, i) => (
                <option key={i+1} value={i+1}>
                  {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-10">Loading report data...</div>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(report.totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(report.totalExpenses)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(report.netProfit)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.breakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis width={85} tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
};
