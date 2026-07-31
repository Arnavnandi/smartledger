import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { dashboardService } from '../../services/dashboard.service';
import type { DashboardSummary, ChartDataPoint, TopClient } from '../../types/dashboard.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  ArrowUpRight, 
  Users,
  Wallet,
  Receipt
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { company, formatCurrency } = useCompany();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [sumData, chart, clients] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getCashFlow(6),
          dashboardService.getTopClients(5)
        ]);
        setSummary(sumData);
        setChartData(chart);
        setTopClients(clients);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const generateInsights = async () => {
    try {
      setInsightsLoading(true);
      const res = await dashboardService.getInsights();
      setInsights(res.insights);
    } catch (err) {
      console.error(err);
      setInsights('Failed to generate insights. Please try again later.');
    } finally {
      setInsightsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  const isPositiveProfit = (summary?.netProfit || 0) >= 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            Welcome back, <strong className="text-indigo-300">{user?.username}</strong> &bull; {company?.name || 'SmartLedger Workspace'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/invoices/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-glow-indigo flex items-center gap-2 transition-all">
              <Plus className="w-4 h-4" /> Create Invoice
            </Button>
          </Link>
          <Link to="/expenses/new">
            <Button size="sm" variant="outline" className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs h-10 px-4 rounded-xl flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-400" /> Log Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Card className="bg-slate-900/70 border-slate-800 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-emerald rounded-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-white">
              {formatCurrency(summary?.totalRevenue || 0)}
            </div>
            <div className="flex items-center text-xs text-emerald-400 font-medium mt-2">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>All-Time Earnings</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="bg-slate-900/70 border-slate-800 hover:border-rose-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-rose rounded-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-rose-400">
              {formatCurrency(summary?.totalExpenses || 0)}
            </div>
            <div className="flex items-center text-xs text-slate-400 font-medium mt-2">
              <span>All-Time Expenses</span>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="bg-slate-900/70 border-slate-800 hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-indigo rounded-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</CardTitle>
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              isPositiveProfit ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {isPositiveProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-extrabold ${isPositiveProfit ? 'text-indigo-400' : 'text-rose-400'}`}>
              {formatCurrency(summary?.netProfit || 0)}
            </div>
            <div className="flex items-center text-xs text-slate-400 font-medium mt-2">
              <Wallet className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              <span>All-Time Net Profit</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="bg-slate-900/70 border-slate-800 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-amber rounded-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Payments</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-400">
              {formatCurrency(summary?.pendingPayments || 0)}
            </div>
            <div className="flex items-center text-xs text-amber-300/80 font-medium mt-2">
              <span>Awaiting Client Collection</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & AI Insights Grid */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Cash Flow Chart */}
        <Card className="md:col-span-4 bg-slate-900/70 border-slate-800 rounded-2xl p-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white">Cash Flow Dynamics</CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Revenue vs Expense comparison over 6 months
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {(() => {
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis width={yAxisWidth} stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => formatCurrency(val)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#f8fafc',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
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
            })()}
          </CardContent>
        </Card>

        {/* Gemini AI Insights Panel */}
        <Card className="md:col-span-3 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 rounded-2xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
          
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-indigo-500/20">
            <div>
              <CardTitle className="flex items-center text-base font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-white bg-clip-text text-transparent">
                <Sparkles className="w-5 h-5 mr-2 text-indigo-400 fill-indigo-400/20 animate-pulse" />
                Gemini Fractional CFO
              </CardTitle>
              <CardDescription className="text-xs text-indigo-200/60 mt-0.5">
                AI Financial Advisory & Insights
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={generateInsights}
              disabled={insightsLoading}
              className="text-indigo-300 hover:text-white hover:bg-indigo-500/20 rounded-xl"
              title="Refresh AI Insights"
            >
              <RefreshCw className={`w-4 h-4 ${insightsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>

          <CardContent className="pt-4">
            {insightsLoading ? (
              <div className="space-y-3 py-4">
                <div className="h-4 bg-indigo-500/20 rounded-lg w-3/4 animate-pulse"></div>
                <div className="h-4 bg-indigo-500/20 rounded-lg w-full animate-pulse"></div>
                <div className="h-4 bg-indigo-500/20 rounded-lg w-5/6 animate-pulse"></div>
              </div>
            ) : insights ? (
              <div className="space-y-3 text-xs leading-relaxed text-slate-200">
                {insights.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*')).map((line, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-indigo-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                    <p className="flex-1 text-slate-300">{line.replace(/^[-*]\s*/, '')}</p>
                  </div>
                ))}
                {!insights.includes('-') && !insights.includes('*') && (
                  <p className="p-3 rounded-xl bg-slate-900/60 border border-indigo-500/20 text-slate-300 leading-relaxed">
                    {insights}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <Sparkles className="w-10 h-10 text-indigo-400/50 mx-auto mb-3" />
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                  Tap below to analyze your income, expense ratios, and cash flow using Gemini AI.
                </p>
                <Button 
                  onClick={generateInsights}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 h-9 rounded-xl shadow-glow-indigo"
                >
                  Generate Financial Insights
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card className="bg-slate-900/70 border-slate-800 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Top Clients by Revenue
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5">
              Your highest-value customer accounts
            </CardDescription>
          </div>
          <Link to="/clients">
            <Button variant="ghost" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {topClients.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No revenue data recorded yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {topClients.map((client, idx) => (
                <div 
                  key={client.clientId}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/80 transition-all"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-200">{client.clientName}</p>
                      <p className="text-[10px] text-slate-400">Account ID: #{client.clientId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-sm text-emerald-400">
                      {formatCurrency(client.totalRevenue)}
                    </p>
                    <p className="text-[10px] text-slate-400">Total Billed</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

