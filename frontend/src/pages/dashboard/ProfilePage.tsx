import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { userService } from '../../services/user.service';
import type { UserProfile } from '../../types/user.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  KeyRound, 
  Building2, 
  CheckCircle2, 
  Loader2, 
  Save, 
  HelpCircle,
  Calendar,
  Sparkles
} from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setPhoneNumber(data.phoneNumber || '');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load user profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and Last name are required');
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await userService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim()
      });
      setProfile(updated);
      toast.success('Profile and contact details updated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await userService.changePassword({
        currentPassword,
        newPassword
      });
      toast.success(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const userInitials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() 
    : user?.username ? user.username.substring(0, 2).toUpperCase() : 'SL';

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-white via-indigo-50/80 to-slate-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 overflow-hidden shadow-xl dark:shadow-2xl transition-colors duration-300">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-emerald-400 p-0.5 shadow-xl shrink-0">
              <div className="w-full h-full bg-indigo-600 dark:bg-slate-900 rounded-[14px] flex items-center justify-center text-xl md:text-2xl font-black text-white">
                {userInitials}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {firstName} {lastName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Account Active
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> {profile?.email}
              </p>
              <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> {company?.name || 'SmartLedger Workspace'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-right shrink-0 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">Account Role</span>
            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-1.5 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" /> {profile?.role || 'ACCOUNT OWNER'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile & Contact Number Form */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden transition-colors duration-300">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <User className="w-4 h-4 text-indigo-500" /> Profile & Client Contact Information
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Update your personal name and direct mobile number for client issues resolution.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name</Label>
                    <Input 
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Jane"
                      className="rounded-xl text-xs h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name</Label>
                    <Input 
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Inspector"
                      className="rounded-xl text-xs h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Email Address</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  </Label>
                  <div className="relative">
                    <Input 
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="rounded-xl text-xs h-10 bg-slate-100/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 cursor-not-allowed pl-9 border-slate-200 dark:border-slate-800"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500">Email address is your primary login identifier.</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <Label htmlFor="phoneNumber" className="text-xs font-semibold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <Phone className="w-3.5 h-3.5" /> Mobile Number for Client Support
                  </Label>
                  <div className="relative">
                    <Input 
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="rounded-xl text-xs h-10 pl-9 font-medium border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-indigo-500/40"
                    />
                    <Phone className="w-4 h-4 text-indigo-500 absolute left-3 top-3" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                      Clients can use this direct phone number to call or WhatsApp you regarding invoice disputes, payments, or billing queries.
                    </span>
                  </p>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={savingProfile}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs h-10 px-6 shadow-glow-indigo flex items-center gap-2 font-semibold"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden transition-colors duration-300">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <KeyRound className="w-4 h-4 text-rose-500" /> Security & Password Update
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Ensure your account is using a strong password.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Password</Label>
                  <Input 
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="rounded-xl text-xs h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Password</Label>
                    <Input 
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="rounded-xl text-xs h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="rounded-xl text-xs h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updatingPassword}
                    variant="outline"
                    className="border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs h-10 px-5 flex items-center gap-2 font-semibold"
                  >
                    {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Client Support Contact Preview Card */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-500/30 text-slate-900 dark:text-white shadow-xl dark:shadow-2xl rounded-2xl overflow-hidden relative transition-colors duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <CardHeader className="border-b border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/30 dark:bg-transparent">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Client Contact Card
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-600 dark:text-slate-300">
                Preview of how your contact details appear to clients for issue resolution.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 relative z-10">
              <div className="flex items-center gap-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-3.5 rounded-xl shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-base shrink-0">
                  {userInitials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{firstName} {lastName}</p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-300 font-medium truncate">{company?.name || 'SmartLedger Representative'}</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Direct Mobile:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {phoneNumber || 'Not configured'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Email Support:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{profile?.email}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Resolution Status:</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> Direct Support Active
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/30 p-3 rounded-xl">
                💡 <strong className="text-slate-800 dark:text-slate-300">Client Tip:</strong> Adding your active mobile number ensures clients can reach out via phone/WhatsApp whenever they have billing questions or need receipt clarification.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
