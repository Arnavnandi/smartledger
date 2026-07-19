import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { invoiceService } from '../../services/invoice.service';
import { aiService } from '../../services/ai.service';
import type { Invoice, InvoiceActivity } from '../../types/invoice.types';
import { useCompany } from '../../context/CompanyContext';

export const InvoiceDetailsPage = () => {
  const { formatCurrency } = useCompany();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [activities, setActivities] = useState<InvoiceActivity[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [aiSummary, setAiSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const fetchInvoice = () => {
    setLoading(true);
    Promise.all([
      invoiceService.getInvoice(Number(id)),
      invoiceService.getInvoiceActivity(Number(id))
    ])
    .then(([invData, actData]) => {
      setInvoice(invData);
      setActivities(actData);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!invoice) return;
    try {
      await invoiceService.updateInvoiceStatus(invoice.id, { status });
      fetchInvoice();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      const blob = await invoiceService.downloadPdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  const handlePrintPdf = async () => {
    if (!invoice) return;
    try {
      const blob = await invoiceService.downloadPdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (err) {
      alert('Failed to prepare print view');
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    try {
      await invoiceService.sendEmail(invoice.id);
      alert('Email sent successfully!');
      fetchInvoice(); // Refresh to update status and activity log
    } catch (err) {
      alert('Failed to send email');
    }
  };

  const handleGenerateSummary = async () => {
    if (!invoice) return;
    setIsSummaryLoading(true);
    try {
      const summary = await aiService.getInvoiceSummary(invoice.id);
      setAiSummary(summary);
    } catch (err) {
      alert('Failed to generate summary');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  if (loading) return <div>Loading invoice details...</div>;
  if (!invoice) return <div>Invoice not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice {invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground mt-1">
            Client: <Link to={`/clients/${invoice.clientId}`} className="hover:underline font-medium text-foreground">{invoice.clientName}</Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Link to="/invoices">
            <Button variant="outline">Back to list</Button>
          </Link>
          
          <Button variant="outline" onClick={handlePrintPdf}>Print</Button>
          <Button variant="outline" onClick={handleDownloadPdf}>Download PDF</Button>
          
          <Button variant="default" onClick={handleSendEmail}>
            Email Invoice
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              Update Status
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => updateStatus('PENDING')} disabled={invoice.status === 'PENDING'}>
                Mark as Pending (Sent)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus('PAID')} disabled={invoice.status === 'PAID'}>
                Mark as Paid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus('OVERDUE')} disabled={invoice.status === 'OVERDUE'}>
                Mark as Overdue
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus('CANCELLED')} disabled={invoice.status === 'CANCELLED'}>
                Cancel Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {invoice.status === 'DRAFT' && (
            <Link to={`/invoices/${invoice.id}/edit`}>
              <Button>Edit Draft</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Invoice Document Preview */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row justify-between items-start border-b pb-6">
              <div>
                <CardTitle className="text-2xl">{invoice.invoiceNumber}</CardTitle>
                <div className="mt-2 text-sm text-muted-foreground space-y-1">
                  <p>Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}</p>
                  <p className="font-medium text-foreground">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={
                  invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                  invoice.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                  ''
                }>{invoice.status}</Badge>
                <h3 className="text-3xl font-bold mt-4">{formatCurrency(invoice.totalAmount)}</h3>
                <p className="text-sm text-muted-foreground mt-1">Total Due</p>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Tax (%)</TableHead>
                    <TableHead className="text-right">Discount (%)</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{item.taxRate}%</TableCell>
                      <TableCell className="text-right">{item.discount}%</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-end mt-6">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(invoice.subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span>{formatCurrency(-invoice.discountTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>{formatCurrency(invoice.taxTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-3 text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {(invoice.notes || invoice.terms) && (
                <div className="mt-10 border-t pt-6 space-y-4">
                  {invoice.notes && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Terms & Conditions</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.terms}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>✨ AI Summary</CardTitle>
                <CardDescription>Generate a professional summary for emails or records.</CardDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={handleGenerateSummary} disabled={isSummaryLoading}>
                {isSummaryLoading ? 'Generating...' : 'Generate'}
              </Button>
            </CardHeader>
            <CardContent>
              {aiSummary ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Click generate to create an AI summary.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Timeline</CardTitle>
              <CardDescription>Activity log for this invoice</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border-l-2 border-primary/20 pl-4 py-1 relative">
                      <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-2"></div>
                      <p className="text-sm font-medium">{activity.actionType}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
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
    </div>
  );
};
