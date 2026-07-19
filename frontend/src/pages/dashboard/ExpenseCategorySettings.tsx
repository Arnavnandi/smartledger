import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, Edit2, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { expenseCategoryService, type ExpenseCategory } from '../../services/expenseCategory.service';

export const ExpenseCategorySettings = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  
  const [name, setName] = useState('');
  const [color, setColor] = useState('#0ea5e9');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await expenseCategoryService.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setColor('#0ea5e9');
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setColor(category.color || '#0ea5e9');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError('Category name is required');
      return;
    }
    
    // Duplicate check
    const isDuplicate = categories.some(c => 
      c.name.toLowerCase() === name.trim().toLowerCase() && c.id !== editingCategory?.id
    );
    if (isDuplicate) {
      setModalError('A category with this name already exists');
      return;
    }

    try {
      setIsSaving(true);
      setModalError('');
      
      if (editingCategory) {
        await expenseCategoryService.updateCategory(editingCategory.id, { name: name.trim(), color } as any);
      } else {
        await expenseCategoryService.createCategory({ name: name.trim(), color } as any);
      }
      
      await fetchCategories();
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${name}"? This action cannot be undone.`)) {
      try {
        await expenseCategoryService.deleteCategory(id);
        await fetchCategories();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Expense Categories</CardTitle>
          <CardDescription>Manage your custom expense categories.</CardDescription>
        </div>
        <Button onClick={openCreateModal} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">Loading categories...</TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No categories found. Click "New Category" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {category.color && (
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: category.color }} 
                          />
                        )}
                        <span className="text-sm text-muted-foreground">{category.color || 'None'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(category)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(category.id, category.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update your category details below.' : 'Add a new category to organize your expenses.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {modalError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{modalError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input 
                id="cat-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Travel, Meals"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-color">Color</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  id="cat-color" 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className="w-16 h-10 p-1"
                />
                <span className="text-sm text-muted-foreground">Optional category color</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
