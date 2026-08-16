
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowRight, Building2, Lock, Mail, Languages, Info, AlertCircle } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useTranslation } from '@/hooks/use-translation';
import { useTenant } from '@/context/tenant-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

/**
 * LoginPage provides a production-grade, admin-only entry point.
 * Pre-filled with default super-admin credentials as requested.
 */
export default function LoginPage() {
  const auth = useAuth();
  const { user } = useUser();
  const { settings } = useSettings();
  const { t, language } = useTranslation();
  const { setLanguage, userRole } = useTenant();
  const router = useRouter();
  
  const [email, setEmail] = React.useState('warriortechsystem@gmail.com');
  const [password, setPassword] = React.useState('admin123');
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (user && userRole) {
      setIsRedirecting(true);
      const roleName = userRole.name?.toLowerCase() || 'admin';
      if (roleName.includes('sales')) {
        router.push('/sales');
      } else if (roleName.includes('accountant')) {
        router.push('/accounts');
      } else if (roleName.includes('technician')) {
        router.push('/support');
      } else {
        router.push('/');
      }
    }
  }, [user, userRole, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setIsLoading(false);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError("Invalid credentials. Please contact your system administrator.");
      } else if (error.code === 'auth/wrong-password') {
        setAuthError("Incorrect password. Please verify your credentials.");
      } else {
        setAuthError("Authentication failed. Please check your network.");
      }
    }
  };

  if (!mounted) return null;

  const loginHero = PlaceHolderImages.find(img => img.id === 'login-hero');

  return (
    <div className="min-h-svh bg-slate-50 overflow-x-hidden">
      
      {/* MOBILE UI */}
      <div className="flex flex-col min-h-svh lg:hidden">
        <div className="h-[40svh] w-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto shadow-2xl overflow-hidden p-2">
              {settings?.companyLogo ? (
                <img src={settings.companyLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-white" />
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black font-headline tracking-tight uppercase">
                {settings?.companyName || "WarriorERP"}
              </h1>
              <p className="text-[10px] font-bold text-blue-100/60 uppercase tracking-[0.2em]">
                {settings?.companySlogan || "Enterprise Resource Terminal"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-[-2.5rem] bg-white rounded-t-[3rem] p-8 flex-1 shadow-2xl relative z-10 flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 shrink-0" />
          
          <div className="max-w-sm mx-auto w-full space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('login')}</h2>
              <p className="text-xs font-medium text-slate-400">Secure Administrative Access Required</p>
            </div>

            {authError && (
              <Alert variant="destructive" className="rounded-2xl border-none bg-red-50 text-red-600 animate-in shake-1">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[10px] font-bold">{authError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t('email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@warrior.com"
                      className="h-14 pl-11 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 transition-all text-sm font-bold" 
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t('password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 pl-11 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 transition-all text-sm font-bold" 
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember-mobile" className="rounded-md border-slate-200" />
                    <label htmlFor="remember-mobile" className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer">{t('remember_me')}</label>
                  </div>
                  <button type="button" className="text-[10px] font-bold text-blue-600 uppercase">{t('forgot_password')}</button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('login')}
              </Button>

              <div className="pt-4 flex items-center justify-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full gap-2 text-slate-400"
                  onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
                >
                  <Languages className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase">{language === 'EN' ? 'বাংলা' : 'English'}</span>
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-auto pt-10 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Warrior Tech System &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>

      {/* DESKTOP UI */}
      <div className="hidden lg:flex min-h-svh flex-row items-stretch bg-slate-50">
        <div className="w-1/2 bg-blue-600 relative overflow-hidden flex items-center justify-center p-16 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
          <div className="absolute inset-0 opacity-30 mix-blend-overlay">
            {loginHero && (
              <Image 
                src={loginHero.imageUrl} 
                alt={loginHero.description} 
                fill 
                className="object-cover"
                priority
                data-ai-hint={loginHero.imageHint}
              />
            )}
          </div>
          
          <div className="relative z-10 max-w-md text-white text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 mb-8 shadow-2xl">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-black font-headline tracking-tighter leading-none mb-6">
              {settings?.companyName || "WarriorERP"}
            </h1>
            <p className="text-xl text-blue-100/80 font-medium leading-relaxed mb-12">
              Professional SaaS ERP for security systems, inventory, and automated billing.
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <ShieldCheck className="h-5 w-5 mb-2 text-blue-300" />
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Security</p>
                <p className="text-sm font-bold">Encrypted Terminals</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <Info className="h-5 w-5 mb-2 text-blue-300" />
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Status</p>
                <p className="text-sm font-bold">Admin Only Access</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-12 relative">
          <div className="absolute top-6 right-6 z-20">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full gap-2 bg-white/80 backdrop-blur-md border-slate-200 text-slate-600 hover:text-blue-600 shadow-sm h-9 px-4"
              onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
            >
              <Languages className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase">{language === 'EN' ? 'বাংলা' : 'English'}</span>
            </Button>
          </div>

          <div className="w-full max-w-md space-y-6 relative">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative">
              
              <div className="text-center mb-10">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 p-2 flex items-center justify-center border border-slate-100 overflow-hidden shadow-inner">
                    {settings?.companyLogo ? (
                      <img src={settings.companyLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <Building2 className="h-7 w-7 text-blue-600" />
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-black font-headline tracking-tight text-slate-900 uppercase">
                  Terminal Login
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Personnel Only</p>
              </div>

              {authError && (
                <Alert variant="destructive" className="mb-6 rounded-2xl border-none bg-red-50 text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription className="text-xs font-bold leading-relaxed">
                    {authError}
                  </AlertDescription>
                </Alert>
              )}

              {isRedirecting ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  <p className="text-sm font-bold text-blue-600 animate-pulse uppercase tracking-widest">Verifying Session...</p>
                </div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('email')} 
                          className="pl-11 h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium border-slate-100 text-sm" 
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('password')}
                          className="pl-11 h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium border-slate-100 text-sm" 
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1 px-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600" />
                        <label htmlFor="remember" className="text-[10px] text-slate-500 font-bold cursor-pointer select-none uppercase">
                          {t('remember_me')}
                        </label>
                      </div>
                      <button type="button" className="text-[10px] font-bold text-blue-600 uppercase hover:underline">
                        {t('forgot_password')}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full h-14 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 gap-2 transition-all active:scale-95" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ArrowRight className="h-5 w-5" />
                        {t('login')}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            <footer className="text-center pb-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Warrior Tech System &copy; {new Date().getFullYear()} <br/>
                Digital ERP Ecosystem
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
