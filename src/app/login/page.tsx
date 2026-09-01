'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Lock, 
  Mail, 
  Languages, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight, 
  Phone, 
  MapPin 
} from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useTranslation } from '@/hooks/use-translation';
import { useTenant } from '@/context/tenant-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const auth = useAuth();
  const { user } = useUser();
  const { settings } = useSettings();
  const { t, language } = useTranslation();
  const { setLanguage, userRole } = useTenant();
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
  const loginHero = PlaceHolderImages.find(img => img.id === 'login-hero');

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-y-auto">
      <div className="flex flex-col min-h-screen lg:flex-row items-stretch">
        {/* LEFT SIDE: HERO & COMPANY INFO (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950" />
          {loginHero && (
            <div className="absolute inset-0 opacity-10 mix-blend-overlay">
              <Image src={loginHero.imageUrl} alt="Warrior ERP" fill className="object-cover" priority data-ai-hint="enterprise business" />
            </div>
          )}
          <div className="relative z-10 text-white text-center space-y-10 w-full max-w-lg">
            <div className="w-32 h-32 rounded-[2.5rem] bg-white p-4 shadow-2xl mx-auto animate-in zoom-in duration-700">
               {settings?.companyLogo ? (
                 <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
               ) : (
                 <div className="w-full h-full bg-blue-600 flex items-center justify-center rounded-2xl text-4xl font-black italic">W</div>
               )}
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black font-headline tracking-tighter leading-tight uppercase">
                {settings?.companyName || "WarriorERP"}
              </h1>
              <p className="text-lg text-blue-100/80 font-bold tracking-widest uppercase italic">
                {settings?.companySlogan || "Innovative Security, Reliable Communication"}
              </p>
            </div>

            {/* CONTACT INFO GRID */}
            <div className="pt-10 border-t border-white/10 grid grid-cols-1 gap-5 text-[11px] font-black uppercase tracking-[0.15em] text-left">
               <div className="flex items-start gap-4 group">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                    <Phone className="h-4 w-4 text-blue-300" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-white/40">Connect Hotline</p>
                    <p className="text-blue-50">{settings?.phone || "+880 1753-646372"}</p>
                  </div>
               </div>
               <div className="flex items-start gap-4 group">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                    <Mail className="h-4 w-4 text-blue-300" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-white/40">Official Support</p>
                    <p className="text-blue-50">{settings?.email || "warriortechsystem@gmail.com"}</p>
                  </div>
               </div>
               <div className="flex items-start gap-4 group">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                    <MapPin className="h-4 w-4 text-blue-300" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-white/40">Corporate Address</p>
                    <p className="text-blue-50 leading-relaxed whitespace-pre-wrap">{settings?.address || "GP Ja-66/2 Gojnabi Rd Wireless Gate Mohakhali Gulshan Dhaka-1212"}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: LOGIN FORM */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
          {/* Mobile Branding Header */}
          <div className="lg:hidden text-center mb-10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-xl mx-auto ring-1 ring-slate-100 flex items-center justify-center">
                {settings?.companyLogo ? (
                  <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-black italic">W</div>
                )}
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{settings?.companyName || "WarriorERP"}</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{settings?.companySlogan}</p>
             </div>
          </div>

          <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-blue-100 border border-slate-100">
            <div className="text-center">
              <h2 className="text-2xl font-black font-headline text-slate-900 uppercase tracking-tight">
                {t('systemLogin')}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
                {t('authorizedAccess')}
              </p>
            </div>

            {authError && (
              <Alert variant="destructive" className="rounded-2xl border-none bg-red-50 text-red-600 animate-in shake duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-bold">{authError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">
                    {t('email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="h-14 pl-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold focus:ring-2 focus:ring-blue-600 transition-all" 
                      placeholder="user@example.com"
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">
                    {t('password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="h-14 pl-12 pr-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold focus:ring-2 focus:ring-blue-600 transition-all" 
                      placeholder="••••••••"
                      required 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-blue-600 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200 transition-all active:scale-95">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowRight className="h-5 w-5 mr-2" /> {t('signInTerminal')}</>}
              </Button>

              <div className="pt-6 flex flex-col items-center gap-4 border-t border-slate-50">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  type="button" 
                  className="rounded-full gap-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-6 transition-all" 
                  onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
                >
                  <Languages className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{language === 'EN' ? 'বাংলা সংস্করণ' : 'English Interface'}</span>
                </Button>
              </div>
            </form>
          </div>
          
          <p className="mt-8 text-[9px] font-black uppercase text-slate-300 tracking-[0.5em] text-center">
             Powered by Warrior Tech System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
