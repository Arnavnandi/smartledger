import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { aiService } from '../../services/ai.service';
import { Sparkles, X } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';

interface KpiExplanationModalProps {
  kpiName: string | null;
  currentValue: number;
  onClose: () => void;
}

export const KpiExplanationModal: React.FC<KpiExplanationModalProps> = ({ kpiName, currentValue, onClose }) => {
  const { formatCurrency } = useCompany();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (kpiName) {
      fetchExplanation();
    } else {
      setExplanation(null);
    }
  }, [kpiName, currentValue]);

  const fetchExplanation = async () => {
    if (!kpiName) return;
    setLoading(true);
    try {
      const text = await aiService.explainKpi(kpiName, currentValue);
      setExplanation(text);
    } catch (err) {
      console.error(err);
      setExplanation("Unable to generate AI explanation at this time.");
    } finally {
      setLoading(false);
    }
  };

  if (!kpiName) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                AI Breakdown: {kpiName}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Current Value: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(currentValue)}</strong>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-5/6 rounded-lg" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : explanation ? (
            <div className="space-y-3 prose dark:prose-invert text-xs max-w-none">
              {explanation.split('\n\n').map((paragraph, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
                  <p className="whitespace-pre-line">{paragraph}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <Button size="sm" onClick={onClose} className="h-8 text-xs rounded-xl bg-indigo-600 text-white hover:bg-indigo-500">
            Close Analysis
          </Button>
        </div>
      </div>
    </div>
  );
};
