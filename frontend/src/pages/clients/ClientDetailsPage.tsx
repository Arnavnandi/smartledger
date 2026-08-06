import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { clientService } from '../../services/client.service';
import type { Client, ClientActivity } from '../../types/client.types';
import { useCompany } from '../../context/CompanyContext';
import { Receipt, CheckCircle2, Loader2, FileText } from 'lucide-react';

export const ClientDetailsPage = () => {
  const { formatCurrency } = useCompany();
  const { id } = useParams();
  
  const [client, setClient] = useState<Client | null>(null);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Opening Balance Invoice Conversion Modal State
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('Invoice generated for historical opening balance migration.');

  const loadClientData = () => {
    if (id) {
      setLoading(true);
      Promise.all([
        clientService.getClient(Number(id)),
        clientService.getClientActivity(Number(id))
      ])
      .then(([clientData, activityData]) => {
        setClient(clientData);
        setActivities(activityData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadClientData();
  }, [id]);

  const handleGenerateInvoice = async () => {
    if (!client) return;
    const balance = client.openingBalance ?? 0;
    if (balance <= 0) {
      toast.error('Client has no historical opening balance to convert.');
      return;
    }

    setIsGenerating(true);
    try {
      const generatedInvoice = await clientService.generateOpeningBalanceInvoice(client.id, {
        dueDate,
        notes
      });
      toast.success(`Opening balance invoice ${generatedInvoice.invoiceNumber || ''} generated successfully!`);
      setShowModal(false);
      loadClientData(); // Refresh client state -> openingBalance will be 0
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to generate opening balance invoice.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading client details...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Client not found.</p>
        <Link to="/clients" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Back to Client List</Button>
        </Link>
      </div>
    );
  }

  const openingBal = client.openingBalance ?? 0;
  const outstandingDue = client.outstandingDue ?? client.outstandingBalance ?? 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{client.name}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{client.email} &bull; {client.phone || 'No phone'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {openingBal > 0 && (
            <Button
              onClick={() => setShowModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-md flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              Generate Opening Balance Invoice
            </Button>
          )}
          <Link to="/clients">
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-9">Back to list</Button>
          </Link>
          <Link to={`/clients/${client.id}/edit`}>
            <Button size="sm" className="rounded-xl text-xs h-9">Edit Client</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Client Overview */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Client Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address</h4>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-200 font-medium">{client.address || 'N/A'}</p>
                </div>

                {/* Historical Opening Balance Stat */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Historical Balance</h4>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(openingBal)}
                  </p>
                  {openingBal > 0 ? (
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Convert to Invoice
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Fully Converted / Zero
                    </span>
                  )}
                </div>

                {/* Total Outstanding Due */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outstanding Due</h4>
                  {outstandingDue > 0 ? (
                    <p className="mt-1 text-xl font-extrabold text-amber-600 dark:text-amber-400">{formatCurrency(outstandingDue)}</p>
                  ) : outstandingDue === 0 ? (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold px-2.5 py-0.5">Settled</Badge>
                    </div>
                  ) : (
                    <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">Credit: {formatCurrency(Math.abs(outstandingDue))}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tags</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {client.tags?.length ? client.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs rounded-lg">{tag}</Badge>
                  )) : <span className="text-xs text-slate-400">No tags assigned</span>}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Internal Notes</h4>
                <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap min-h-[90px] border border-slate-100 dark:border-slate-800">
                  {client.notes || 'No private notes added.'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity History */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Activity History</CardTitle>
              <CardDescription className="text-xs text-slate-500">Recent events & balance conversions</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400">No activity recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border-l-2 border-indigo-500/40 pl-3.5 py-1 relative">
                      <div className="absolute w-2 h-2 bg-indigo-500 rounded-full -left-[5px] top-2"></div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{activity.actionType}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{activity.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Opening Balance Invoice Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-lg font-bold">
              <Receipt className="w-5 h-5 text-emerald-500" />
              Generate Opening Balance Invoice
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Convert historical debt into a standard SmartLedger invoice to collect payment through email, UPI QR, and online portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Client:</span>
                <span className="font-bold text-slate-900 dark:text-white">{client.name}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700/60 pt-2">
                <span className="text-slate-500 dark:text-slate-400">Opening Balance Amount:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(openingBal)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700/60 pt-2">
                <span className="text-slate-500 dark:text-slate-400">Line Item Description:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">Historical Outstanding Balance</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dueDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Invoice Due Date</Label>
              <Input 
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Internal Notes / Terms</Label>
              <Textarea 
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                placeholder="Optional notes for invoice..."
              />
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/30 text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
              💡 <strong>Accounting Safeguard:</strong> Converting this balance will automatically set Opening Balance = {formatCurrency(0)}, moving the amount into a pending invoice. Your total Outstanding Due remains exactly the same ({formatCurrency(outstandingDue)}).
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)} disabled={isGenerating} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleGenerateInvoice} 
              disabled={isGenerating} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 px-4"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Generate Invoice Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
