import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '../../components/shared/AnimatedCounter';
import { ExecutiveCopilotWidget } from '../../components/shared/ExecutiveCopilotWidget';
import { KpiExplanationModal } from '../../components/shared/KpiExplanationModal';
import { dashboardService } from '../../services/dashboard.service';
import type { DashboardSummary, ChartDataPoint, TopClient } from '../../types/dashboard.types';
import { 
  DollarSign, 
  CreditCard, 
  Wallet, 
  AlertCircle,
  Plus,
  Receipt,
  Users,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useCompany } from '../../context/CompanyContext';

export const DashboardPage = () => {
  const { formatCurrency } = useCompany();
  const { user } = { user: JSON.parse(localStorage.getItem('smartledger_user') || '{}') };
  const { company } = useCompany();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);

  // KPI Modal State
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [selectedKpiValue, setSelectedKpiValue] = useState<number>(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sum, chart, clients] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getCashFlow(),
        dashboardService.getTopClients()
      ]);
      setSummary(sum);
      setChartData(chart);
      setTopClients(clients);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKpiClick = (kpiName: string, val: number) => {
    setSelectedKpi(kpiName);
    setSelectedKpiValue(val);
  };

  const isPositiveProfit = (summary?.netProfit || 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      <KpiExplanationModal
        kpiName={selectedKpi}
        currentValue={selectedKpiValue}
        onClose={() => setSelectedKpi(null)}
      />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-600 dark:from-white dark:via-slate-100 dark:to-indigo-300 bg-clip-text text-transparent">
            Financial Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            Welcome back, <strong className="text-indigo-600 dark:text-indigo-300">{user?.username || 'User'}</strong> &bull; {company?.name || 'SmartLedger Workspace'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/invoices/new">
            <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-glow-indigo flex items-center gap-2 transition-all transform active:scale-95">
              <Plus className="w-4 h-4" /> Create Invoice
            </Button>
          </Link>
          <Link to="/expenses/new">
            <Button size="sm" variant="outline" className="border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs h-10 px-4 rounded-xl flex items-center gap-2 transition-all">
              <Receipt className="w-4 h-4 text-rose-500 dark:text-rose-400" /> Log Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive KPI Stat Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-3 rounded-2xl bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3 w-28" />
            </Card>
          ))
        ) : (
          <>
            {/* Revenue */}
            <motion.div 
              whileHover={{ y: -4 }} 
              transition={{ duration: 0.2 }}
              onClick={() => handleKpiClick('Total Revenue', summary?.totalRevenue || 0)}
              className="cursor-pointer"
            >
              <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 border-t-4 border-t-emerald-500 hover:border-emerald-500/50 transition-all duration-300 shadow-sm hover:shadow-glow-emerald rounded-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Revenue</CardTitle>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    <AnimatedCounter value={summary?.totalRevenue || 0} formatter={(val) => formatCurrency(val)} />
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" /> Click card for AI Analysis
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Expenses */}
            <motion.div 
              whileHover={{ y: -4 }} 
              transition={{ duration: 0.2 }}
              onClick={() => handleKpiClick('Total Expenses', summary?.totalExpenses || 0)}
              className="cursor-pointer"
            >
              <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 border-t-4 border-t-rose-500 hover:border-rose-500/50 transition-all duration-300 shadow-sm hover:shadow-glow-rose rounded-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expenses</CardTitle>
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    <AnimatedCounter value={summary?.totalExpenses || 0} formatter={(val) => formatCurrency(val)} />
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" /> Click card for AI Analysis
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Net Profit */}
            <motion.div 
              whileHover={{ y: -4 }} 
              transition={{ duration: 0.2 }}
              onClick={() => handleKpiClick('Net Profit', summary?.netProfit || 0)}
              className="cursor-pointer"
            >
              <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 border-t-4 border-t-indigo-500 hover:border-indigo-500/50 transition-all duration-300 shadow-sm hover:shadow-glow-indigo rounded-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Profit</CardTitle>
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isPositiveProfit ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-extrabold ${isPositiveProfit ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                    <AnimatedCounter value={summary?.netProfit || 0} formatter={(val) => formatCurrency(val)} />
                  </div>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" /> Click card for AI Analysis
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pending Payments */}
            <motion.div 
              whileHover={{ y: -4 }} 
              transition={{ duration: 0.2 }}
              onClick={() => handleKpiClick('Pending Payments', summary?.pendingPayments || 0)}
              className="cursor-pointer"
            >
              <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 border-t-4 border-t-amber-500 hover:border-amber-500/50 transition-all duration-300 shadow-sm hover:shadow-glow-amber rounded-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Payments</CardTitle>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    <AnimatedCounter value={summary?.pendingPayments || 0} formatter={(val) => formatCurrency(val)} />
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" /> Click card for AI Analysis
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* AI Financial Copilot Executive Widget */}
      <ExecutiveCopilotWidget />

      {/* Cash Flow Dynamics & Top Clients Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recharts Cash Flow */}
        <Card className="md:col-span-2 bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Cash Flow Dynamics</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Monthly revenue collection against expense totals</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <Skeleton className="h-72 w-full rounded-xl" />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-[#334155]" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis width={80} stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => formatCurrency(val)} />
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
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clients Ranking */}
        <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Top Clients</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">By total billed invoice revenue</CardDescription>
            </div>
            <Users className="w-5 h-5 text-indigo-500" />
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : topClients.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No client invoice activity recorded yet.</p>
            ) : (
              topClients.map((client, idx) => (
                <div key={client.clientId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{client.clientName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Top Revenue Contributor</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(client.totalRevenue)}</p>
                    <Link to={`/clients/${client.clientId}`} className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-end gap-0.5">
                      View <ArrowUpRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
