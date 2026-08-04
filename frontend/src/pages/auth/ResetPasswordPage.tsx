import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get('token');
  const token = rawToken ? rawToken.trim() : null;
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('[DEBUG RESET PAGE] window.location.href:', window.location.href);
    console.log('[DEBUG RESET PAGE] window.location.search:', window.location.search);
    console.log('[DEBUG RESET PAGE] Extracted rawToken from URL:', rawToken);
    console.log('[DEBUG RESET PAGE] Cleaned token:', token);
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing password reset link. Please request a new link from the login page.');
    }
  }, [token, rawToken]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Missing reset token. Please check your reset email link.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setStatus('loading');
    console.log('[DEBUG RESET SUBMIT] POST payload:', { token, newPassword: '***' });
    try {
      const res = await authService.resetPassword(token, password);
      console.log('[DEBUG RESET SUCCESS] Server response:', res);
      setStatus('success');
      setMessage(res.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      console.error('[DEBUG RESET ERROR] Exception response:', err.response?.data);
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create New Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={status === 'loading' || status === 'success'}>
              {status === 'loading' ? 'Resetting...' : 'Reset Password'}
            </Button>
            {status === 'success' && (
              <div className="text-center mt-4">
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Go to Login
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
