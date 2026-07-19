import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { dashboardService } from '../../services/dashboard.service';
import type { DashboardSummary, ChartDataPoint, TopClient } from '../../types/dashboard.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, CreditCard, TrendingUp, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCompany();
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
    return <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Loading your financial dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.username}. Here's your financial overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalRevenue || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(summary?.totalExpenses || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-primary' : 'text-red-500'}`}>
              {formatCurrency(summary?.netProfit || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{formatCurrency(summary?.pendingPayments || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting from clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Insights */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Cash Flow Overview</CardTitle>
            <CardDescription>Revenue vs Expenses over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            {(() => {
              const maxDataValue = chartData.length > 0 
                ? Math.max(...chartData.flatMap(d => [d.revenue, d.expense]))
                : 100000;
              const maxFormattedString = formatCurrency(maxDataValue);
              const yAxisWidth = Math.max(85, maxFormattedString.length * 9 + 20);
              
              return (
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
                      <YAxis width={yAxisWidth} tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      <Legend verticalAlign="top" align="right" height={36} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#16a34a" fillOpacity={1} fill="url(#colorRev)" />
                      <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* AI Insights Card */}
        <Card className="md:col-span-3 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-primary">
                <Sparkles className="w-5 h-5 mr-2" />
                AI Financial Insights
              </CardTitle>
              <CardDescription>Your fractional CFO</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={generateInsights} disabled={insightsLoading}>
              <RefreshCw className={`w-4 h-4 ${insightsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-primary/20 rounded w-3/4"></div>
                <div className="h-4 bg-primary/20 rounded w-full"></div>
                <div className="h-4 bg-primary/20 rounded w-5/6"></div>
              </div>
            ) : insights ? (
              <div className="prose prose-sm dark:prose-invert">
                <ul className="space-y-2 text-sm leading-relaxed">
                  {insights.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*')).map((line, i) => (
                    <li key={i}>{line.replace(/^[-*]\s*/, '')}</li>
                  ))}
                  {/* Fallback if AI didn't format as list */}
                  {!insights.includes('-') && !insights.includes('*') && (
                     <p>{insights}</p>
                  )}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Analyze your cash flow and get actionable business advice from Gemini AI.
                </p>
                <Button onClick={generateInsights}>Generate Insights</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Table */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardDescription>Your highest revenue-generating clients.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No client revenue data available yet.</p>
              ) : (
                topClients.map((client) => (
                  <div key={client.clientId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {client.clientName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium">{client.clientName}</p>
                    </div>
                    <div className="font-bold text-green-600">
                      {formatCurrency(client.totalRevenue)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
