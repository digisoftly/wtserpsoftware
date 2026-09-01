'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2, 
  Shield
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useTenant } from '@/context/tenant-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const auth = useAuth();
  const { user } = useUser();
  const { t } = useTranslation();
  const { settings, userRole } = useTenant();
  const router = useRouter();
  
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (user && userRole && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/');
    }
  }, [user, userRole, router, isRedirecting]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setIsLoading(false);
      setAuthError(t('loginFailed'));
    }
  };

  if (!mounted) return null;

  // Full Module List (23 Items)
  const defaultGrid = [
    { label: "বিক্রয়", icon: "ShoppingCart", color: "bg-emerald-500/20 text-emerald-400" },
    { label: "কোটেশন", icon: "FileText", color: "bg-amber-500/20 text-amber-400" },
    { label: "চালান", icon: "Truck", color: "bg-orange-500/20 text-orange-400" },
    { label: "ক্রয়", icon: "Package", color: "bg-rose-500/20 text-rose-400" },
    { label: "রিটার্নস", icon: "RotateCcw", color: "bg-red-500/20 text-red-400" },
    { label: "ইনভেন্টরি", icon: "Boxes", color: "bg-sky-500/20 text-sky-400" },
    { label: "মাস্টার ডাটা", icon: "Database", color: "bg-slate-500/20 text-slate-400" },
    { label: "সিরিয়াল", icon: "Scan", color: "bg-purple-500/20 text-purple-400" },
    { label: "প্রকল্প", icon: "ClipboardList", color: "bg-teal-500/20 text-teal-400" },
    { label: "সার্ভিস চুক্তি", icon: "Handshake", color: "bg-indigo-500/20 text-indigo-400" },
    { label: "গ্রাহক", icon: "Users", color: "bg-blue-500/20 text-blue-400" },
    { label: "সরবরাহকারী", icon: "Store", color: "bg-rose-600/20 text-rose-400" },
    { label: "হিসাব", icon: "Wallet", color: "bg-amber-600/20 text-amber-500" },
    { label: "ব্যয়", icon: "Receipt", color: "bg-red-600/20 text-red-500" },
    { label: "সাপোর্ট", icon: "LifeBuoy", color: "bg-indigo-600/20 text-indigo-500" },
    { label: "সিআরএম", icon: "Target", color: "bg-rose-700/20 text-rose-500" },
    { label: "এইচআরএম", icon: "Briefcase", color: "bg-purple-600/20 text-purple-500" },
    { label: "শাখা", icon: "Building2", color: "bg-slate-600/20 text-slate-500" },
    { label: "রিপোর্ট", icon: "BarChart3", color: "bg-blue-700/20 text-blue-500" },
    { label: "এআই", icon: "Zap", color: "bg-violet-600/20 text-violet-400" },
    { label: "সেটিংস", icon: "Settings", color: "bg-slate-700/20 text-slate-500" },
    { label: "ইউজার", icon: "UserRoundCog", color: "bg-violet-700/20 text-violet-500" },
    { label: "অডিট লগ", icon: "ShieldAlert", color: "bg-red-800/20 text-red-600" },
  ];

  const gridItems = settings?.loginGridItems || defaultGrid;

  return (
    <div className="min-h-screen flex items-stretch bg-[#F3F4F6] overflow-hidden">
      {/* LEFT SIDE: BRANDING & COMPACT GRID */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-[#0F4C44] text-white p-8 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F4C44] via-[#136A5F] to-[#0A332E]" />
        
        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-4 animate-in fade-in duration-700">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center p-2.5 border border-white/20 shadow-2xl">
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-8 h-8 bg-emerald-400 rounded-lg" />
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black font-headline tracking-tighter uppercase leading-none">
              {settings?.companyName || "WARRIOR TECH ERP"}
            </h1>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em] mt-1 opacity-80">
              {settings?.companySlogan || "ENTERPRISE SOLUTIONS"}
            </p>
          </div>
        </div>

        {/* Content & Ultra-Compact Grid */}
        <div className="relative z-10 space-y-4 mt-2">
          <div className="space-y-1">
            <h2 className="text-2xl xl:text-3xl font-black font-headline tracking-tight leading-tight animate-in slide-in-from-left-4 duration-1000">
              {settings?.loginHeadline || "২৩টি মডিউল একটি প্ল্যাটফর্মে"}
            </h2>
            <p className="text-[10px] font-medium text-emerald-100/60 uppercase tracking-[0.2em]">
              {settings?.loginSubHeadline || "ব্যবসার প্রতিটি বিভাগ, এক জায়গা থেকেই নিয়ন্ত্রণ"}
            </p>
          </div>
          
          {/* 6-Column Grid Layout - Ultra Compact to fit without scrolling */}
          <div className="max-h-[70vh] overflow-hidden animate-in zoom-in-95 duration-700 delay-300">
            <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
              {gridItems.map((item: any, idx: number) => {
                const Icon = (Icons as any)[item.icon] || Icons.LayoutGrid;
                return (
                  <div key={idx} className="bg-white/5 backdrop-blur-md rounded-xl p-2 flex flex-col items-center justify-center gap-1 border border-white/10 group hover:bg-white/10 hover:scale-[1.05] transition-all cursor-default min-h-[65px] shadow-lg">
                    <div className={cn(
                      "p-1.5 rounded-lg shadow-md transition-all duration-300 group-hover:scale-110", 
                      item.color || "bg-emerald-500/20 text-emerald-400"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity text-center leading-tight">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] opacity-30 mb-1">
            Standard Enterprise Stack
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <p className="text-[9px] font-bold text-emerald-400/50 uppercase tracking-widest">
               {settings?.address || "GP Ja-66/2 Gojnabi Rd, Dhaka-1212"}
            </p>
            <p className="text-[9px] font-bold text-emerald-400/50 uppercase tracking-widest">
               {settings?.phone || "+880 1753-646372"}
            </p>
            <p className="text-[9px] font-bold text-emerald-400/50 uppercase tracking-widest">
               {settings?.email || "warriortechsystem@gmail.com"}
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative bg-white">
        <div className="w-full max-w-md space-y-10 relative z-10 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="text-center space-y-4">
             <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-100 transform -rotate-3 hover:rotate-0 transition-transform">
                <Shield className="h-10 w-10 text-white" />
             </div>
             <div className="space-y-1">
                <h2 className="text-3xl font-black font-headline text-[#0F4C44] uppercase tracking-tight">স্বাগতম</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Identity Authentication</p>
             </div>
          </div>

          {authError && (
            <Alert variant="destructive" className="rounded-2xl border-none bg-red-50 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-bold">{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">ইমেইল অ্যাড্রেস</Label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-14 px-6 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition-all" 
                    placeholder="name@company.com"
                    required 
                  />
               </div>
               <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">পাসওয়ার্ড</Label>
                    <button type="button" className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline">রিসেট করুন</button>
                  </div>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="h-14 px-6 pr-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition-all" 
                      placeholder="••••••••"
                      required 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
               </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-16 rounded-2xl bg-[#0F4C44] hover:bg-[#136A5F] text-white font-black uppercase tracking-[0.25em] shadow-2xl shadow-emerald-900/10 transition-all active:scale-[0.98] text-xs">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "নিরাপদ লগইন"}
            </Button>
          </form>

          <div className="text-center opacity-40">
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                &copy; ২০২৪ Warrior Tech ERP <br/> Authorized Access Points Only
             </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[100px] opacity-60 -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50 rounded-full blur-[120px] opacity-40 -z-10" />
      </div>
    </div>
  );
}
