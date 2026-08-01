import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { aiService, type AiExecutiveSummary } from '../../services/ai.service';
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, Lightbulb, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export const ExecutiveCopilotWidget: React.FC = () => {
  const [summary, setSummary] = useState<AiExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await aiService.getExecutiveSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate AI executive insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30';
    if (score >= 65) return 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30';
    if (score >= 50) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30';
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden relative font-sans">
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center shadow-sm text-white font-black">
            <Sparkles className="w-4 h-4 text-white fill-current" />
          </div>
          <div>
            <CardTitle className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Gemini AI Financial Copilot
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 dark:text-slate-400">Autonomous CFO Executive Advisory</CardDescription>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchSummary}
          disabled={loading}
          className="h-8 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Copilot
        </Button>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            <Skeleton className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            <Skeleton className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60" />
          </div>
        ) : summary ? (
          <>
            {/* Top Score Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-xl border font-black text-xl flex items-center justify-center ${getScoreColor(summary.financialScore)}`}>
                  {summary.financialScore}<span className="text-xs font-normal opacity-70">/100</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Financial Health:</span>
                    <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                      {summary.healthStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{summary.topInsight}</p>
                </div>
              </div>
            </div>

            {/* Risk vs Opportunity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Biggest Risk Factor
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">{summary.biggestRisk}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" /> Growth Opportunity
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">{summary.biggestOpportunity}</p>
              </div>
            </div>

            {/* Suggested Action Bar */}
            <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">Recommended Action: </span>
                  <span className="text-slate-700 dark:text-slate-200 text-[11px]">{summary.suggestedAction}</span>
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};
