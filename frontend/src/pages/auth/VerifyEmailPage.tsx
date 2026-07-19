import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const effectRan = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    if (effectRan.current) return;
    effectRan.current = true;

    const verify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(res.message);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. Token may be expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-muted/40">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>We are verifying your email address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && <p>Please wait...</p>}
          {status === 'success' && (
            <Alert className="bg-green-50 text-green-700 border-green-200">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {status !== 'loading' && (
            <Link to="/login" className="w-full mt-4 block">
              <Button className="w-full">Go to Login</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
