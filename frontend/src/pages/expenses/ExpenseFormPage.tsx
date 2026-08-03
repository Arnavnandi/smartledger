import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { expenseService } from '../../services/expense.service';
import { expenseCategoryService, type ExpenseCategory } from '../../services/expenseCategory.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, UploadCloud, Plus, Loader2, Sparkles, Bot, CheckCircle2, RotateCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { ExpenseRequest } from '../../types/expense.types';
import { useCompany } from '../../context/CompanyContext';

const expenseSchema = z.object({
  vendorName: z.string().min(1, 'Vendor name is required'),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  expenseDate: z.string().min(1, 'Date is required'),
  categoryId: z.any().transform(v => v === "" || v === null || v === undefined ? undefined : Number(v)),
  description: z.string().default(''),
  receiptUrl: z.string().default(''),
});

export const ExpenseFormPage = () => {
  const { currencySymbol } = useCompany();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#0ea5e9');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    expenseCategoryService.getCategories()
      .then(setCategories)
      .catch((err) => {
        console.error(err);
        setError('Failed to load categories. Please try again.');
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
  }, []);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ExpenseRequest>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      expenseDate: new Date().toISOString().split('T')[0],
      amount: 0,
      vendorName: '',
      categoryId: undefined,
      description: '',
      receiptUrl: ''
    }
  });

  const selectedCategoryId = watch('categoryId');

  const onSubmit = async (data: ExpenseRequest) => {
    try {
      await expenseService.createExpense(data);
      navigate('/expenses');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save expense');
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const parsedData = await expenseService.uploadReceipt(file);
      
      if (parsedData.vendorName) setValue('vendorName', parsedData.vendorName);
      if (parsedData.amount) setValue('amount', parsedData.amount);
      if (parsedData.expenseDate) setValue('expenseDate', parsedData.expenseDate);
      if (parsedData.category) {
        const matched = categories.find(c => c.name.toLowerCase() === parsedData.category?.toLowerCase());
        if (matched) {
          setValue('categoryId', matched.id);
        }
      }
      if (parsedData.receiptUrl) setValue('receiptUrl', parsedData.receiptUrl);
      
      setUploadSuccess(true);
      toast.success("Receipt parsed successfully!");
    } catch (err: any) {
      console.error("[RECEIPT UPLOAD ERROR]", err);
      const serverMsg = err.response?.data?.message || err.message || "Failed to extract details from receipt image.";
      setUploadError(serverMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isUploading && e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const isSaveDisabled = isSubmitting || !selectedCategoryId;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }
    try {
      setIsCreatingCategory(true);
      setCategoryError('');
      const newCategory = await expenseCategoryService.createCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor
      } as any);
      
      setCategories(prev => [...prev, newCategory]);
      setValue('categoryId', newCategory.id);
      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategoryColor('#0ea5e9');
    } catch (err: any) {
      setCategoryError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Log Expense</h1>
        <Button variant="outline" onClick={() => navigate('/expenses')}>Cancel</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileSelect} 
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-6 rounded-2xl shadow-lg space-y-4 border border-indigo-500/30">
          <div className="flex items-center gap-3 border-b border-indigo-400/30 pb-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm shrink-0">
              <Bot className="w-5 h-5 text-indigo-200 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />
                Parsing receipt with AI...
              </h4>
              <p className="text-[11px] text-indigo-200 mt-0.5">
                {selectedFile?.name || 'Receipt Image'} {selectedFile ? `(${(selectedFile.size / 1024).toFixed(1)} KB)` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-indigo-100 font-medium">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span>Extracting vendor...</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span>Reading total amount...</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span>Detecting date...</span>
            </div>
          </div>
          <p className="text-[11px] text-indigo-300 text-center font-medium">Please wait while Gemini AI analyzes the receipt document...</p>
        </div>
      ) : uploadSuccess ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                Receipt Parsed Successfully!
              </h4>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Vendor, amount & date auto-populated below.</p>
            </div>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => { setUploadSuccess(false); setSelectedFile(null); fileInputRef.current?.click(); }}
            className="h-8 text-xs text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            Scan Another
          </Button>
        </div>
      ) : uploadError ? (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">{uploadError}</p>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => { setUploadError(null); fileInputRef.current?.click(); }}
            className="h-8 text-xs text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/50 shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <Card 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed transition-all duration-200 cursor-pointer rounded-2xl text-center p-8 ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]' 
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-100/50 dark:hover:bg-slate-900/80'
          }`}
        >
          <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" /> AI Receipt Auto-fill
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Drag & drop receipt image here, or <span className="text-indigo-600 dark:text-indigo-400 font-bold underline">click to browse</span>
              </p>
            </div>
            <span className="inline-block text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Supports PNG, JPG, WEBP (Up to 10MB)
            </span>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
            <CardDescription>Verify or manually enter your expense details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor *</Label>
                <Input id="vendorName" {...register('vendorName')} placeholder="e.g. Home Depot" />
                {errors.vendorName && <p className="text-sm text-red-500">{errors.vendorName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({currencySymbol}) *</Label>
                <Input id="amount" type="number" step="0.01" {...register('amount')} />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Date *</Label>
                <Input id="expenseDate" type="date" {...register('expenseDate')} />
                {errors.expenseDate && <p className="text-sm text-red-500">{errors.expenseDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <div className="flex gap-2">
                  <select 
                    id="categoryId" 
                    {...register('categoryId')}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  >
                    {categoriesLoading ? (
                      <option value="">Loading categories...</option>
                    ) : categories.length === 0 ? (
                      <option value="">No categories available. Please create one first.</option>
                    ) : (
                      <>
                        <option value="">Select a category...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    title="Add Category"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} placeholder="Optional details..." />
            </div>
            
            <input type="hidden" {...register('receiptUrl')} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaveDisabled}>
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </Button>
        </div>
      </form>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Expense Category</DialogTitle>
            <DialogDescription>Add a new category to organize your expenses.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            {categoryError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{categoryError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="newCategoryName">Name *</Label>
              <Input 
                id="newCategoryName" 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)} 
                placeholder="e.g. Travel, Office Supplies"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCategoryColor">Color</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  id="newCategoryColor" 
                  type="color" 
                  value={newCategoryColor} 
                  onChange={(e) => setNewCategoryColor(e.target.value)} 
                  className="w-16 h-10 p-1"
                />
                <span className="text-sm text-muted-foreground">Optional category color indicator</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isCreatingCategory}>
                {isCreatingCategory ? 'Creating...' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
