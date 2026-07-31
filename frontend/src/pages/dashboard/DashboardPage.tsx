import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '../../components/shared/AnimatedCounter';
import { dashboardService } from '../../services/dashboard.service';
import type { DashboardSummary, ChartDataPoint, TopClient } from '../../types/dashboard.types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  AlertCircle,
  Plus,
  Receipt,
  Sparkles,
  RefreshCw,
  Users,
  ArrowUpRight
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
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

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

  const generateInsights = async () => {
    setInsightsLoading(true);
    try {
      const result = await dashboardService.getInsights();
      setInsights(result.insights);
    } catch (err) {
      console.error(err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const isPositiveProfit = (summary?.netProfit || 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-8 max-w-7xl mx-auto"
    >
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

      {/* KPI Stat Cards */}
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
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
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
                  <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    <span>All-Time Earnings</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Expenses */}
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 border-t-4 border-t-rose-500 hover:border-rose-500/50 transition-all duration-300 shadow-sm hover:shadow-glow-rose rounded-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expenses</CardTitle>
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                    <AnimatedCounter value={summary?.totalExpenses || 0} formatter={(val) => formatCurrency(val)} />
                  </div>
                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
                    <span>All-Time Expenses</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Net Profit */}
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 border-t-4 border-t-indigo-500 hover:border-indigo-500/50 transition-all duration-300 shadow-sm hover:shadow-glow-indigo rounded-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Profit</CardTitle>
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                    isPositiveProfit ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}>
                    {isPositiveProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-extrabold ${isPositiveProfit ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    <AnimatedCounter value={summary?.netProfit || 0} formatter={(val) => formatCurrency(val)} />
                  </div>
                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
                    <Wallet className="w-3.5 h-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
                    <span>All-Time Net Profit</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pending Payments */}
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 border-t-4 border-t-amber-500 hover:border-amber-500/50 transition-all duration-300 shadow-sm hover:shadow-glow-amber rounded-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Payments</CardTitle>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                    <AnimatedCounter value={summary?.pendingPayments || 0} formatter={(val) => formatCurrency(val)} />
                  </div>
                  <div className="flex items-center text-xs text-amber-600/80 dark:text-amber-300/80 font-medium mt-2">
                    <span>Awaiting Client Collection</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Charts & AI Insights Grid */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Cash Flow Chart */}
        <Card className="md:col-span-4 bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Cash Flow Dynamics</CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Revenue vs Expense comparison over 6 months
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Skeleton className="h-[320px] w-full rounded-xl" />
            ) : (
              (() => {
                const maxDataValue = chartData.length > 0 
                  ? Math.max(...chartData.flatMap(d => [d.revenue, d.expense]))
                  : 100000;
                const maxFormattedString = formatCurrency(maxDataValue);
                const yAxisWidth = Math.max(85, maxFormattedString.length * 8 + 20);
                
                return (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                        <YAxis width={yAxisWidth} stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => formatCurrency(val)} />
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
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                        <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>

        {/* AI Financial Insights */}
        <Card className="md:col-span-3 bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Gemini Financial Advisory
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI-driven analysis of cash flow & margins
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={generateInsights}
              disabled={insightsLoading}
              className="text-indigo-600 dark:text-indigo-300 hover:text-slate-900 dark:hover:text-white hover:bg-indigo-500/20 rounded-xl"
              title="Refresh AI Insights"
            >
              <RefreshCw className={`w-4 h-4 ${insightsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>

          <CardContent className="pt-4">
            {insightsLoading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : insights ? (
              <div className="space-y-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                {insights.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*')).map((line, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-indigo-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-1.5 shrink-0"></span>
                    <p className="flex-1 text-slate-700 dark:text-slate-300">{line.replace(/^[-*]\s*/, '')}</p>
                  </div>
                ))}
                {!insights.includes('-') && !insights.includes('*') && (
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-indigo-500/20 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {insights}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <Sparkles className="w-10 h-10 text-indigo-500/50 dark:text-indigo-400/50 mx-auto mb-3" />
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4">
                  Tap below to analyze your income, expense ratios, and cash flow using Gemini AI.
                </p>
                <Button 
                  onClick={generateInsights}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 h-9 rounded-xl shadow-glow-indigo transition-all transform active:scale-95"
                >
                  Generate Financial Insights
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Top Clients by Revenue
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Your highest-value customer accounts
            </CardDescription>
          </div>
          <Link to="/clients">
            <Button variant="ghost" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : topClients.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No revenue data recorded yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {topClients.map((client, idx) => (
                <div 
                  key={client.clientId}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{client.clientName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Account ID: #{client.clientId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(client.totalRevenue)}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Total Billed</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
