import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { companyService } from '../../services/company.service';
import type { CompanyProfile, CompanyProfileUpdateRequest } from '../../types/company.types';
import type { FormEvent } from 'react';
import { ExpenseCategorySettings } from './ExpenseCategorySettings';
import { useCompany } from '../../context/CompanyContext';

export const CompanySettingsPage = () => {
  const { refreshCompany } = useCompany();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CompanyProfileUpdateRequest>();

  useEffect(() => {
    companyService.getProfile()
      .then(data => {
        setProfile(data);
        reset({
          name: data.name,
          gstNumber: data.gstNumber || '',
          address: data.address || '',
          currency: data.currency || 'USD',
          taxRate: data.taxRate || 0,
          invoicePrefix: data.invoicePrefix || 'INV-'
        });
        setStatus('idle');
      })
      .catch(() => {
        setStatus('error');
        setMessage('Failed to load company profile.');
      });
  }, [reset]);

  const onSubmit = async (data: CompanyProfileUpdateRequest) => {
    try {
      setStatus('loading');
      const updated = await companyService.updateProfile(data);
      setProfile(updated);
      await refreshCompany();
      setStatus('success');
      setMessage('Settings updated successfully.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to update settings.');
    }
  };

  const handleLogoUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!logoFile) return;
    try {
      setStatus('loading');
      const updated = await companyService.uploadLogo(logoFile);
      setProfile(updated);
      setLogoFile(null);
      setStatus('success');
      setMessage('Logo uploaded successfully.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to upload logo.');
    }
  };

  if (!profile && status === 'loading') {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your business profile and preferences.
        </p>
      </div>

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {status === 'success' && (
        <Alert className="bg-green-50 text-green-700 border-green-200">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="categories">Expense Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Settings Form */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Company Profile & Preferences</CardTitle>
                <CardDescription>Update your company details and invoicing preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Business Name</Label>
                      <Input id="name" {...register('name', { required: 'Name is required' })} />
                      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstNumber">GST / Tax Number</Label>
                      <Input id="gstNumber" {...register('gstNumber')} placeholder="Optional" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Business Address</Label>
                      <Input id="address" {...register('address')} placeholder="Full address" />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Display Currency (Base: INR)</Label>
                      <select 
                        id="currency" 
                        {...register('currency')}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                      <Input id="taxRate" type="number" step="0.01" {...register('taxRate', { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                      <Input id="invoicePrefix" {...register('invoicePrefix')} placeholder="INV-" />
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Settings'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Business Logo</CardTitle>
                <CardDescription>Upload a logo to display on your invoices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.logoUrl && (
                  <div className="border rounded-md p-4 flex justify-center bg-muted/20">
                    <img src={profile.logoUrl} alt="Business Logo" className="h-20 object-contain" />
                  </div>
                )}
                <form onSubmit={handleLogoUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Upload New Logo (JPG/PNG)</Label>
                    <Input 
                      id="logo" 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)} 
                    />
                  </div>
                  <Button type="submit" variant="secondary" disabled={!logoFile || status === 'loading'}>
                    Upload Logo
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <ExpenseCategorySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
