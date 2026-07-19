import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { invoiceService } from '../../services/invoice.service';
import { clientService } from '../../services/client.service';
import { aiService } from '../../services/ai.service';
import type { InvoiceRequest } from '../../types/invoice.types';
import type { Client } from '../../types/client.types';
import { useCompany } from '../../context/CompanyContext';

export const InvoiceBuilderPage = () => {
  const { formatCurrency, currencySymbol } = useCompany();
  const { id } = useParams();
  const isEditing = !!id && id !== 'new';
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState('');
  
  // AI Assistant State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [enhancingField, setEnhancingField] = useState<'notes' | 'terms' | null>(null);

  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<InvoiceRequest>({
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, discount: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  
  const watchItems = watch('items');

  useEffect(() => {
    // Fetch clients for dropdown
    clientService.getClients(0, 100).then(res => setClients(res.content)).catch(console.error);

    if (isEditing) {
      invoiceService.getInvoice(Number(id)).then(inv => {
        if (inv.status !== 'DRAFT') {
          alert('Only DRAFT invoices can be edited.');
          navigate(`/invoices/${id}`);
          return;
        }
        reset({
          clientId: inv.clientId,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          notes: inv.notes || '',
          terms: inv.terms || '',
          status: inv.status,
          items: inv.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate || 0,
            discount: item.discount || 0
          }))
        });
      }).catch(() => setError('Failed to load invoice.'));
    }
  }, [id, isEditing, reset, navigate]);

  const onSubmit = async (data: InvoiceRequest, action: 'save_draft' | 'save_pending') => {
    try {
      data.status = action === 'save_pending' ? 'PENDING' : 'DRAFT';
      
      let savedInv;
      if (isEditing) {
        savedInv = await invoiceService.updateInvoice(Number(id), data);
      } else {
        savedInv = await invoiceService.createInvoice(data);
      }
      navigate(`/invoices/${savedInv.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save invoice.');
    }
  };

  // Preview Calculations
  const calculateTotals = () => {
    let sub = 0;
    let tax = 0;
    let disc = 0;
    let total = 0;

    watchItems.forEach(item => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.unitPrice) || 0;
      const t = Number(item.taxRate) || 0;
      const d = Number(item.discount) || 0;

      const itemSub = q * p;
      const itemDisc = itemSub * (d / 100);
      const postDisc = itemSub - itemDisc;
      const itemTax = postDisc * (t / 100);
      
      sub += itemSub;
      disc += itemDisc;
      tax += itemTax;
      total += (postDisc + itemTax);
    });

    return { sub, tax, disc, total };
  };

  const handleAiAutoFill = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const items = await aiService.suggestItems(aiPrompt);
      if (items && items.length > 0) {
        // Clear empty rows if needed, or just append
        items.forEach(item => append({
          description: item.description || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          taxRate: item.taxRate || 0,
          discount: item.discount || 0
        }));
        setAiPrompt('');
        setIsAiModalOpen(false);
      }
    } catch (err) {
      alert("Failed to generate items from AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleEnhanceText = async (field: 'notes' | 'terms') => {
    const currentText = watch(field);
    if (!currentText) return;
    
    setEnhancingField(field);
    try {
      const enhanced = await aiService.enhanceText(currentText);
      reset({ ...watch(), [field]: enhanced });
    } catch (err) {
      alert("Failed to enhance text.");
    } finally {
      setEnhancingField(null);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{isEditing ? 'Edit Draft Invoice' : 'Create New Invoice'}</h1>
        <Button variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client <span className="text-destructive">*</span></Label>
              <select 
                id="clientId" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('clientId', { required: 'Client is required', valueAsNumber: true })}
              >
                <option value="">Select a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date <span className="text-destructive">*</span></Label>
              <Input type="date" id="issueDate" {...register('issueDate', { required: 'Required' })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date <span className="text-destructive">*</span></Label>
              <Input type="date" id="dueDate" {...register('dueDate', { required: 'Required' })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add products or services.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsAiModalOpen(true)}>
                ✨ Auto-fill with AI
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, taxRate: 0, discount: 0 })}>
                + Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Description</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Tax %</TableHead>
                  <TableHead>Disc %</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Input placeholder="Item description" {...register(`items.${index}.description` as const, { required: true })} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="1" {...register(`items.${index}.quantity` as const, { required: true, valueAsNumber: true })} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" {...register(`items.${index}.unitPrice` as const, { required: true, valueAsNumber: true })} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" {...register(`items.${index}.taxRate` as const, { valueAsNumber: true })} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" {...register(`items.${index}.discount` as const, { valueAsNumber: true })} />
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" className="text-destructive" onClick={() => remove(index)}>
                        &times;
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {errors.items && <p className="text-sm text-destructive mt-2">At least one valid item is required.</p>}

            <div className="flex justify-end mt-6">
              <div className="w-64 space-y-2 border rounded-md p-4 bg-muted/20">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.sub)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount:</span>
                  <span className="text-destructive">{formatCurrency(-totals.disc)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2 text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="notes">Notes</Label>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-primary" onClick={() => handleEnhanceText('notes')} disabled={enhancingField === 'notes'}>
                  {enhancingField === 'notes' ? 'Enhancing...' : '✨ Enhance'}
                </Button>
              </div>
              <Textarea id="notes" placeholder="Thank you for your business!" {...register('notes')} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-primary" onClick={() => handleEnhanceText('terms')} disabled={enhancingField === 'terms'}>
                  {enhancingField === 'terms' ? 'Enhancing...' : '✨ Enhance'}
                </Button>
              </div>
              <Textarea id="terms" placeholder="Payment due within 14 days." {...register('terms')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={handleSubmit((d) => onSubmit(d, 'save_draft'))}>
            Save as Draft
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={handleSubmit((d) => onSubmit(d, 'save_pending'))}>
            Save & Mark as Sent (Pending)
          </Button>
        </div>
      </form>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>✨ AI Invoice Assistant</DialogTitle>
            <DialogDescription>
              Describe the work you did or the products you sold, and the AI will auto-generate your invoice items with descriptions, standard quantities, and estimated prices.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder={`e.g. I fixed a leaky sink which took 2 hours and bought parts for ${currencySymbol}45.`}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="h-32"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAiAutoFill} disabled={isAiLoading || !aiPrompt.trim()}>
              {isAiLoading ? 'Generating...' : 'Auto-fill Items'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
