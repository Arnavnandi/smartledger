import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { authService, loginSchema } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react';

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await authService.login(data);
      await login(response.accessToken, response.refreshToken);
      toast.success('Welcome back to SmartLedger!');
      navigate(from, { replace: true });
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      const userFriendlyMsg = (!serverMsg || serverMsg === 'Bad credentials')
        ? 'Invalid email address or password. Please try again.'
        : serverMsg;
      toast.error(userFriendlyMsg);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Left Brand Illustration Column (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-12 flex-col justify-between overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center shadow-glow-indigo text-slate-950 font-black">
            <Sparkles className="w-6 h-6 text-slate-950 fill-current" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            SmartLedger
          </span>
        </div>

        {/* Main Value Proposition */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Bank-Grade Financial Operating System
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Real-Time Cash Flow Dynamics & Automated Ledger Advisory.
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Manage billing, track expenses, forecast revenue, and generate Gemini AI financial insights in one unified dashboard.
          </p>

          {/* Testimonial Badge */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Over ₹1.4M+ Tracked</p>
              <p className="text-[10px] text-slate-400">Automated invoices & multi-currency conversions</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span>&copy; {new Date().getFullYear()} SmartLedger Technologies</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Systems Operational</span>
        </div>
      </div>

      {/* Right Login Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-950 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/20 via-transparent to-transparent"></div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md space-y-6 relative z-10"
        >
          {/* Mobile Brand Title */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center shadow-glow-indigo text-slate-950 font-black">
              <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
            </div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              SmartLedger
            </span>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Sign In to SmartLedger</h2>
            <p className="text-xs text-slate-400">Enter your business email credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="h-10 text-xs rounded-xl border-slate-800 bg-slate-900/80 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-300">Password</Label>
                <Link to="/forgot-password" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-10 text-xs rounded-xl border-slate-800 bg-slate-900/80 text-white placeholder:text-slate-500 pr-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-glow-indigo transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? 'Authenticating...' : <>Sign In to Workspace <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-slate-900">
            <p className="text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-4">
                Create account now
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
