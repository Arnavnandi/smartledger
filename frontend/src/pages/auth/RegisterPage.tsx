import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { authService, registerSchema } from '../../services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const watchPassword = watch('password', '');

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const response = await authService.register(data);
      toast.success(response.message || 'Registration successful! Check your email to verify.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(watchPassword);

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Left Brand Illustration Column */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-12 flex-col justify-between overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center shadow-glow-indigo text-slate-950 font-black">
            <Sparkles className="w-6 h-6 text-slate-950 fill-current" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            SmartLedger
          </span>
        </div>

        {/* Value Prop Points */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Start Free Workspace
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Join Thousands of Business Owners Managing Financials Effortlessly.
          </h1>

          <div className="space-y-3">
            {[
              'Automated PDF invoice generation and payment tracking',
              'Multi-currency expense logging and OCR receipt scanning',
              'Gemini AI financial CFO advisory for cash flow trends',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span>&copy; {new Date().getFullYear()} SmartLedger Technologies</span>
          <span>Instant Setup &bull; No Credit Card Required</span>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-950 relative overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md space-y-6 relative z-10 py-6"
        >
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Create Your Account</h2>
            <p className="text-xs text-slate-400">Get started with SmartLedger in less than 2 minutes</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-xs font-semibold text-slate-300">First Name</Label>
                <Input id="firstName" placeholder="John" className="h-9 text-xs rounded-xl border-slate-800 bg-slate-900/80 text-white placeholder:text-slate-500" {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-rose-400">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-xs font-semibold text-slate-300">Last Name</Label>
                <Input id="lastName" placeholder="Doe" className="h-9 text-xs rounded-xl border-slate-800 bg-slate-900/80 text-white placeholder:text-slate-500" {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-rose-400">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-300">Business Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" className="h-9 text-xs rounded-xl border-slate-800 bg-slate-900/80 text-white placeholder:text-slate-500" {...register('email')} />
              {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-9 text-xs rounded-xl border-slate-800 bg-slate-900/80 text-white placeholder:text-slate-500 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}

              {/* Password Strength Meter */}
              {watchPassword && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength >= 1 ? 'w-1/4 bg-rose-500' : 'w-0'}`}></div>
                    <div className={`h-full transition-all duration-300 ${strength >= 2 ? 'w-1/4 bg-amber-500' : 'w-0'}`}></div>
                    <div className={`h-full transition-all duration-300 ${strength >= 3 ? 'w-1/4 bg-indigo-500' : 'w-0'}`}></div>
                    <div className={`h-full transition-all duration-300 ${strength >= 4 ? 'w-1/4 bg-emerald-500' : 'w-0'}`}></div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Strength:{' '}
                    <strong className={strength >= 3 ? 'text-emerald-400' : 'text-amber-400'}>
                      {strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong'}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-glow-indigo transition-all transform active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? 'Registering Account...' : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-slate-900">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-4">
                Sign in instead
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
