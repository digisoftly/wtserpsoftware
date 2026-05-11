
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
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

export default function LoginPage() {
  const auth = useAuth();
  const { user } = useUser();
  const { settings } = useSettings();
  const { t, language } = useTranslation();
  const { setLanguage, userRole } = useTenant();
  const router = useRouter();
  
  const [email, setEmail] = React.useState('erpwts@gmail.com');
  const [password, setPassword] = React.useState('adminwts123');
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

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    signInWithEmailAndPassword(auth, email, password)
      .catch((error: any) => {
        setIsLoading(false);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          setAuthError(t('errorSub'));
        } else {
          setAuthError("Authentication failed. Please check your network.");
        }
      });
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setAuthError(null);
    initiateAnonymousSignIn(auth);
  };

  if (!mounted) return null;

  const loginHero = PlaceHolderImages.find(img => img.id === 'login-hero');

  return (
    <div className="min-h-svh flex flex-col lg:flex-row items-stretch bg-slate-50 overflow-y-auto">
      {/* LEFT PANE: BRANDING & ILLUSTRATION (Desktop Only or Top on Mobile if desired) */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-8 md:p-16">
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
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 mb-6 md:mb-8 shadow-2xl">
            <Building2 className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter leading-none mb-4 md:mb-6">
            {settings?.companyName || "WarriorERP"}
          </h1>
          <p className="text-base md:text-xl text-blue-100/80 font-medium leading-relaxed mb-8 md:mb-12">
            A unified ecosystem for your security business. Manage sales, inventory, and field services in one powerful workspace.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 mb-2 text-blue-300" />
              <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest opacity-60">Security</p>
              <p className="text-xs md:text-sm font-bold">Encrypted Data</p>
            </div>
            <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Info className="h-4 w-4 md:h-5 md:w-5 mb-2 text-blue-300" />
              <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest opacity-60">Uptime</p>
              <p className="text-xs md:text-sm font-bold">99.9% Reliable</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 min-h-svh">
        <div className="w-full max-w-md space-y-6 md:space-y-8 relative">
          {/* Language Toggle */}
          <div className="absolute -top-12 md:top-0 right-0 flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full gap-2 text-slate-500 hover:text-blue-600 transition-colors h-8"
              onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
            >
              <Languages className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase">{language === 'EN' ? 'বাংলা' : 'English'}</span>
            </Button>
          </div>

          <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-8 md:mb-10">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 p-2 flex items-center justify-center border border-slate-100 overflow-hidden shadow-inner">
                  {settings?.companyLogo ? (
                    <img src={settings.companyLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Building2 className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  )}
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-black font-headline tracking-tight text-slate-900 uppercase">
                {t('login')} / {t('login_bn')}
              </h2>
              <p className="text-slate-500 mt-2 font-medium text-xs md:text-sm">{t('signin_to_continue')}</p>
            </div>

            {authError && (
              <Alert variant="destructive" className="mb-6 rounded-xl md:rounded-2xl border-none bg-red-50 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[10px] md:text-xs font-bold">
                  {authError}
                </AlertDescription>
              </Alert>
            )}

            {isRedirecting ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-blue-600" />
                <p className="text-[10px] md:text-sm font-bold text-blue-600 animate-pulse uppercase tracking-widest">Establishing Session...</p>
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4 md:space-y-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-2">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input 
                        id="email" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('email')} 
                        className="pl-11 h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium border-slate-100 text-sm" 
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('password')}
                        className="pl-11 h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium border-slate-100 text-sm" 
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600" />
                      <label htmlFor="remember" className="text-[10px] md:text-xs text-slate-600 font-bold cursor-pointer select-none">
                        {t('remember_me')}
                      </label>
                    </div>
                    <button type="button" className="text-[10px] md:text-xs text-blue-600 font-bold hover:underline transition-all">
                      {t('forgot_password')}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl text-base md:text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 gap-2 transition-all active:scale-95" 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowRight className="h-5 w-5" /> {t('login')}</>}
                </Button>

                <div className="relative py-2 md:py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em]">
                    <span className="bg-white px-4 text-slate-400">Demo Access</span>
                  </div>
                </div>

                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl gap-3 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 font-bold transition-all text-slate-600 text-sm" 
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  Guest Administrator
                </Button>
              </form>
            )}
          </div>

          <footer className="text-center pb-4">
            <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              {settings?.companyName || "Warrior Tech System"} &copy; {new Date().getFullYear()} <br/>
              ERP Central Management System
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
