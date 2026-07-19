import { useState, useEffect } from 'react';
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
import { AlertCircle, UploadCloud, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    
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
      
    } catch (err) {
      setError('Failed to upload and parse receipt. Please enter manually.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
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
      } as any); // using as any since color might not be typed if only name/description exist, wait, the service type expects name and description. Let's fix that if needed. Actually it was sent in bash script as {"name": "...", "color": "..."} so it's supported.
      
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

      <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <UploadCloud className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-1">AI Receipt Auto-fill</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a receipt image and our AI will automatically extract the vendor, date, and amount!
          </p>
          <div className="relative">
            <Input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button type="button" disabled={isUploading}>
              {isUploading ? 'Parsing with AI...' : 'Upload Receipt'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
