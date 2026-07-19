import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { clientService } from '../../services/client.service';
import type { ClientRequest } from '../../types/client.types';

export const ClientFormPage = () => {
  const { id } = useParams();
  const isEditing = !!id && id !== 'new';
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClientRequest>();

  useEffect(() => {
    if (isEditing) {
      clientService.getClient(Number(id)).then(client => {
        reset({
          name: client.name,
          email: client.email,
          phone: client.phone || '',
          address: client.address || '',
          notes: client.notes || '',
          outstandingBalance: client.outstandingBalance
        });
        setTags(client.tags || []);
      }).catch(() => {
        setError('Failed to load client details.');
      });
    }
  }, [id, isEditing, reset]);

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const onSubmit = async (data: ClientRequest) => {
    try {
      data.tags = tags;
      if (isEditing) {
        await clientService.updateClient(Number(id), data);
      } else {
        await clientService.createClient(data);
      }
      navigate('/clients');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save client.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{isEditing ? 'Edit Client' : 'Add New Client'}</h1>
        <Button variant="outline" onClick={() => navigate('/clients')}>Cancel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Enter the details for this client.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Client/Company Name <span className="text-destructive">*</span></Label>
                <Input id="name" {...register('name', { required: 'Name is required' })} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                })} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...register('phone')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outstandingBalance">Outstanding Balance</Label>
                <Input id="outstandingBalance" type="number" step="0.01" {...register('outstandingBalance', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register('address')} />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <Input 
                placeholder="Type and press Enter to add tags..." 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} &times;
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea id="notes" {...register('notes')} placeholder="Add private notes about this client..." />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Client'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
