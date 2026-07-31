import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { companyService } from '../../services/company.service';
import type { CompanyProfile, CompanyProfileUpdateRequest } from '../../types/company.types';
import type { FormEvent } from 'react';
import { ExpenseCategorySettings } from './ExpenseCategorySettings';
import { useCompany } from '../../context/CompanyContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Laptop, Building2, Tag, Palette, ShieldCheck, Upload, Save } from 'lucide-react';

export const CompanySettingsPage = () => {
  const { refreshCompany } = useCompany();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CompanyProfileUpdateRequest>();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await companyService.getProfile();
      setProfile(data);
      reset({
        name: data.name,
        gstNumber: data.gstNumber || '',
        address: data.address || '',
        currency: data.currency || 'USD',
        taxRate: data.taxRate || 0,
        invoicePrefix: data.invoicePrefix || 'INV-'
      });
    } catch (err) {
      toast.error('Failed to load company profile.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CompanyProfileUpdateRequest) => {
    try {
      const updated = await companyService.updateProfile(data);
      setProfile(updated);
      await refreshCompany();
      toast.success('Company settings updated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update settings.');
    }
  };

  const handleLogoUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!logoFile) return;
    try {
      const updated = await companyService.uploadLogo(logoFile);
      setProfile(updated);
      setLogoFile(null);
      toast.success('Business logo uploaded successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload logo.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6 mx-auto">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-4xl space-y-6 mx-auto"
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-600 dark:from-white dark:via-slate-100 dark:to-indigo-300 bg-clip-text text-transparent">
          Account & Workspace Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your business profile, invoicing preferences, appearance, and categories.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl flex flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="text-xs rounded-lg flex items-center gap-1.5 px-3.5 py-2">
            <Building2 className="w-3.5 h-3.5" /> Profile & Details
          </TabsTrigger>
          <TabsTrigger value="categories" className="text-xs rounded-lg flex items-center gap-1.5 px-3.5 py-2">
            <Tag className="w-3.5 h-3.5" /> Expense Categories
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs rounded-lg flex items-center gap-1.5 px-3.5 py-2">
            <Palette className="w-3.5 h-3.5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs rounded-lg flex items-center gap-1.5 px-3.5 py-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Security & Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Settings Form */}
            <Card className="md:col-span-2 bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Company Profile & Preferences</CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Update company details, tax registration, and invoice prefixes.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Business Name</Label>
                      <Input id="name" className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50" {...register('name', { required: 'Name is required' })} />
                      {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gstNumber" className="text-xs font-semibold text-slate-700 dark:text-slate-300">GST / Tax Number</Label>
                      <Input id="gstNumber" className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50" {...register('gstNumber')} placeholder="e.g. 22AAAAA0000A1Z5" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="address" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Business Address</Label>
                      <Input id="address" className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50" {...register('address')} placeholder="Full business address for invoice footer" />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1.5">
                      <Label htmlFor="currency" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Default Currency</Label>
                      <select 
                        id="currency" 
                        {...register('currency')}
                        className="flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="taxRate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Default Tax Rate (%)</Label>
                      <Input id="taxRate" type="number" step="0.01" className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50" {...register('taxRate', { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="invoicePrefix" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Invoice Prefix</Label>
                      <Input id="invoicePrefix" className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50" {...register('invoicePrefix')} placeholder="INV-" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-glow-indigo transition-all transform active:scale-95 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Logo Upload Card */}
            <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Business Logo</CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Upload a high-resolution logo to display on generated invoice PDFs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.logoUrl && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-center bg-slate-50 dark:bg-slate-800/40">
                    <img src={profile.logoUrl} alt="Business Logo" className="h-20 object-contain" />
                  </div>
                )}
                <form onSubmit={handleLogoUpload} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <Label htmlFor="logo" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Upload PNG/JPG Logo</Label>
                    <Input 
                      id="logo" 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                    />
                  </div>
                  <Button type="submit" variant="secondary" disabled={!logoFile} className="h-9 text-xs rounded-xl flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Upload Logo
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <ExpenseCategorySettings />
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Theme & Display Settings</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Customize how SmartLedger looks on your device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 font-bold' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <span className="text-xs">Light Theme</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                >
                  <Moon className="w-6 h-6 text-indigo-400" />
                  <span className="text-xs">Dark Theme</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                >
                  <Laptop className="w-6 h-6 text-slate-400" />
                  <span className="text-xs">System Default</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Security & Password</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Manage account access and authentication parameters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Two-Factor Authentication (2FA)</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Secure your workspace logins with authenticator apps.</p>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg" onClick={() => toast.info('2FA settings feature enabled.')}>
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
