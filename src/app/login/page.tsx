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
  LayoutGrid,
  ShoppingCart,
  Boxes,
  Users,
  Wallet,
  Package,
  BarChart3,
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
  const { t, language } = useTranslation();
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

  // Default Grid Items if settings are empty
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
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-4 h-4 bg-emerald-400 rounded-sm" />
          <h1 className="text-2xl font-black font-headline tracking-tighter uppercase">
            <span className="text-white">WARRIOR</span>
            <span className="text-emerald-400 ml-1">TECH</span>
          </h1>
        </div>

        {/* Content & Grid */}
        <div className="relative z-10 space-y-12">
          <h2 className="text-3xl font-black font-headline tracking-tight max-w-md">
            {settings?.loginHeadline || "২১টি মডিউল একটি প্ল্যাটফর্মে"}
          </h2>
          
          <div className="grid grid-cols-3 gap-6 max-w-3xl">
            {gridItems.map((item: any, idx: number) => {
              const Icon = (Icons as any)[item.icon] || Icons.LayoutGrid;
              return (
                <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center justify-center gap-4 border border-white/5 group hover:bg-white/20 transition-all cursor-default aspect-square">
                  <div className={cn("p-3 rounded-xl shadow-lg transition-transform group-hover:scale-110", item.color || "bg-emerald-500/20 text-emerald-400")}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest opacity-80">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest opacity-40">
            {settings?.loginSubHeadline || "ব্যবসার প্রতিটি বিভাগ, এক জায়গা থেকেই নিয়ন্ত্রণ"}
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 md:p-14 space-y-8 relative overflow-hidden">
          <div className="text-center space-y-4">
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-100">
                <Shield className="h-8 w-8 text-white" />
             </div>
             <div className="space-y-1">
                <h2 className="text-2xl font-black font-headline text-[#0F4C44] uppercase tracking-tight">স্বাগতম</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warrior Tech ERP</p>
             </div>
          </div>

          {authError && (
            <Alert variant="destructive" className="rounded-xl border-none bg-red-50 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-bold">{authError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <div className="relative">
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="h-12 px-5 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300" 
                      placeholder="ইউজারনেম"
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
                      className="h-12 px-5 pr-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-sm focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300" 
                      placeholder="পাসওয়ার্ড"
                      required 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
               </div>
            </div>

            <div className="flex justify-end">
               <button type="button" className="text-[11px] font-black text-blue-500 uppercase tracking-widest hover:underline">পাসওয়ার্ড ভুলে গেছেন?</button>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-xl bg-[#0F4C44] hover:bg-[#136A5F] text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/10 transition-all active:scale-95 text-xs">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "লগইন"}
            </Button>
          </form>

          <div className="text-center">
             <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                &copy; ২০২৪ Warrior Tech ERP, সর্বস্বত্ব সংরক্ষিত
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
