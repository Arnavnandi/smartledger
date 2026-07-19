import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { clientService } from '../../services/client.service';
import type { Client, ClientActivity } from '../../types/client.types';
import { useCompany } from '../../context/CompanyContext';

export const ClientDetailsPage = () => {
  const { formatCurrency } = useCompany();
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
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
  }, [id]);

  if (loading) {
    return <div>Loading client details...</div>;
  }

  if (!client) {
    return <div>Client not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground mt-1">{client.email} | {client.phone}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/clients">
            <Button variant="outline">Back to list</Button>
          </Link>
          <Link to={`/clients/${client.id}/edit`}>
            <Button>Edit Client</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
                  <p className="mt-1 whitespace-pre-wrap">{client.address || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Outstanding Balance</h4>
                  <p className={`mt-1 text-xl font-bold ${client.outstandingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(client.outstandingBalance)}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {client.tags?.length ? client.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  )) : <span className="text-sm text-muted-foreground">No tags assigned</span>}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Internal Notes</h4>
                <div className="mt-2 p-4 bg-muted/50 rounded-md whitespace-pre-wrap min-h-[100px]">
                  {client.notes || 'No notes added.'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>Recent actions for this client</CardDescription>
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
