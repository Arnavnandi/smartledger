import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink, QrCode, ShieldCheck } from 'lucide-react';

export const PublicPaymentPage = () => {
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  const invoiceNumber = searchParams.get('invoice') || 'INV-0001';
  const amount = searchParams.get('amount') || '0.00';
  const companyName = searchParams.get('company') || 'SmartLedger Merchant';
  const upiId = searchParams.get('upi') || '8586808192@pthdfc';
  const currency = searchParams.get('currency') || '₹';
  const formattedAmount = (parseFloat(amount) || 0).toFixed(2);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(companyName)}&am=${encodeURIComponent(formattedAmount)}&cu=INR&tn=${encodeURIComponent('Invoice ' + invoiceNumber)}&tr=${encodeURIComponent(invoiceNumber)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayNow = () => {
    window.location.href = upiUrl;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-slate-100 shadow-2xl">
        <CardHeader className="text-center pb-4 border-b border-slate-700">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">{companyName}</CardTitle>
          <CardDescription className="text-slate-400">
            Payment Portal &bull; Invoice #{invoiceNumber}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Amount Display */}
          <div className="text-center p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
            <p className="text-sm font-medium text-slate-400">Total Amount Due</p>
            <p className="text-4xl font-extrabold text-emerald-400 mt-1">
              {currency}{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handlePayNow}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Pay via GPay / PhonePe / Paytm
            </Button>

            <Button
              variant="outline"
              onClick={handleCopyUpi}
              className="w-full h-11 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'UPI ID Copied!' : `Copy UPI ID: ${upiId}`}
            </Button>
          </div>

          {/* QR Code Section */}
          <div className="border-t border-slate-700/60 pt-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <QrCode className="w-4 h-4 text-emerald-400" />
              Scan QR Code with any UPI App
            </div>
            <div className="inline-block p-3 bg-white rounded-xl shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`}
                alt="Payment QR Code"
                className="w-44 h-44"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Supports Google Pay, PhonePe, Paytm, BHIM & All Banking Apps
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
