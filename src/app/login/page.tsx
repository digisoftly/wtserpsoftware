
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  // Default Grid Items
  const defaultGrid = [
    { label: "বিক্রয়", icon: "ShoppingCart", color: "bg-emerald-500/20 text-emerald-400" },
    { label: "ইনভেন্টরি", icon: "Boxes", color: "bg-orange-500/20 text-orange-400" },
    { label: "এইচআর", icon: "Users", color: "bg-blue-500/20 text-blue-400" },
    { label: "হিসাব", icon: "Wallet", color: "bg-purple-500/20 text-purple-400" },
    { label: "ক্রয়", icon: "Package", color: "bg-red-500/20 text-red-400" },
    { label: "রিপোর্ট", icon: "BarChart3", color: "bg-sky-500/20 text-sky-400" },
  ];

  const gridItems = settings?.loginGridItems || defaultGrid;

  return (
    <div className="min-h-screen flex items-stretch bg-[#F3F4F6] overflow-hidden">
      {/* LEFT SIDE: BRANDING & GRID (Visible on LG) */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-[#0F4C44] text-white p-16 flex-col justify-between overflow-hidden">
        {/* Dynamic Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F4C44] via-[#136A5F] to-[#0A332E]" />
        
        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-4 animate-in fade-in duration-700">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center p-2 border border-white/20 shadow-2xl">
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-6 h-6 bg-emerald-400 rounded-sm" />
            )}
          </div>
          <h1 className="text-2xl font-black font-headline tracking-tighter uppercase">
            <span className="text-white">{settings?.companyName?.split(' ')[0] || "WARRIOR"}</span>
            <span className="text-emerald-400 ml-1">{settings?.companyName?.split(' ').slice(1).join(' ') || "TECH"}</span>
          </h1>
        </div>

        {/* Content & Grid */}
        <div className="relative z-10 space-y-16">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-black font-headline tracking-tight leading-[1.1] animate-in slide-in-from-left-4 duration-1000">
              {settings?.loginHeadline || "২১টি মডিউল একটি প্ল্যাটফর্মে"}
            </h2>
            <p className="text-base font-medium text-emerald-100/60 uppercase tracking-[0.2em]">
              {settings?.loginSubHeadline || "ব্যবসার প্রতিটি বিভাগ, এক জায়গা থেকেই নিয়ন্ত্রণ"}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-6 max-w-3xl animate-in zoom-in-95 duration-700 delay-300">
            {gridItems.map((item: any, idx: number) => {
              const Icon = (Icons as any)[item.icon] || Icons.LayoutGrid;
              return (
                <div key={idx} className="bg-white/5 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center justify-center gap-4 border border-white/10 group hover:bg-white/10 hover:scale-[1.02] transition-all cursor-default aspect-square shadow-xl">
                  <div className={cn(
                    "p-4 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl", 
                    item.color || "bg-emerald-500/20 text-emerald-400"
                  )}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <span className="text-[12px] font-black uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 flex flex-col gap-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">
            Enterprise Grade Infrastructure
          </p>
          <p className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest">
            {settings?.address || "GP Ja-66/2 Gojnabi Rd, Dhaka-1212"}
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] p-10 md:p-14 space-y-10 relative overflow-hidden ring-1 ring-slate-100 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="text-center space-y-6">
             <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-100 transform -rotate-3 hover:rotate-0 transition-transform">
                <Shield className="h-10 w-10 text-white" />
             </div>
             <div className="space-y-1">
                <h2 className="text-3xl font-black font-headline text-[#0F4C44] uppercase tracking-tight">স্বাগতম</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Identity Authentication</p>
             </div>
          </div>

          {authError && (
            <Alert variant="destructive" className="rounded-2xl border-none bg-red-50 text-red-600 animate-in shake-1 duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-bold">{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <div className="relative">
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="h-14 px-6 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300" 
                      placeholder="ইউজারনেম / ইমেইল"
                      required 
                    />
                  </div>
               </div>
               <div className="space-y-1.5">
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="h-14 px-6 pr-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300" 
                      placeholder="পাসওয়ার্ড"
                      required 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
               </div>
            </div>

            <div className="flex justify-end px-1">
               <button type="button" className="text-[11px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-colors">পাসওয়ার্ড ভুলে গেছেন?</button>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-16 rounded-[1.5rem] bg-[#0F4C44] hover:bg-[#136A5F] text-white font-black uppercase tracking-[0.25em] shadow-2xl shadow-emerald-900/10 transition-all active:scale-[0.98] text-xs">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "নিরাপদ লগইন"}
            </Button>
          </form>

          <div className="text-center pt-4">
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                &copy; ২০২৪ Warrior Tech ERP <br/> All Rights Reserved
             </p>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50 -z-10" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-30 -z-10" />
      </div>
    </div>
  );
}
