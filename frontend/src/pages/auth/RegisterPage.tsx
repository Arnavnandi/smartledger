import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService, registerSchema } from '../../services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError(null);
      const response = await authService.register(data);
      setSuccess(response.message || 'Registration successful! Please check your email.');
      setTimeout(() => navigate('/login'), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 text-center pb-2">
            <div className="mx-auto w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center shadow-glow-indigo text-slate-950 font-black mb-2">
              <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-white">Create Your Account</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Get started with SmartLedger financial management</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 rounded-xl">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name</Label>
                  <Input id="firstName" placeholder="John" className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50" {...register('firstName')} />
                  {errors.firstName && <p className="text-xs text-rose-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50" {...register('lastName')} />
                  {errors.lastName && <p className="text-xs text-rose-500">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</Label>
                <Input id="email" type="email" placeholder="name@company.com" className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50" {...register('email')} />
                {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !!success}
                className="w-full h-10 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-glow-indigo transition-all transform active:scale-95 mt-2"
              >
                {isSubmitting ? 'Creating Account...' : 'Register Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};
