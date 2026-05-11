'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowRight, Building2, Lock, Mail, Languages, Info, AlertCircle, Sparkles, UserPlus } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useTranslation } from '@/hooks/use-translation';
import { useTenant } from '@/context/tenant-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

/**
 * LoginPage provides a high-fidelity, bilingual SaaS login experience.
 * Now includes a registration option to ensure demo credentials can be created on-the-fly.
 */
export default function LoginPage() {
  const auth = useAuth();
  const { user } = useUser();
  const { settings } = useSettings();
  const { t, language } = useTranslation();
  const { setLanguage, userRole } = useTenant();
  const router = useRouter();
  
  // Default prototype credentials
  const [email, setEmail] = React.useState('erpwts@gmail.com');
  const [password, setPassword] = React.useState('adminwts123');
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login');
  
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
      // Intelligent role-based redirection
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
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error("Auth Error:", error.code);
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError("Account not found. Please use the 'Register' tab to create this demo user.");
      } else if (error.code === 'auth/wrong-password') {
        setAuthError("Incorrect password. Please verify your credentials.");
      } else if (error.code === 'auth/email-already-in-use') {
        setAuthError("This email is already registered. Please switch to the 'Login' tab.");
      } else if (error.code === 'auth/weak-password') {
        setAuthError("Password is too weak. Use at least 6 characters.");
      } else {
        setAuthError("Authentication failed. Please check your network or Firebase configuration.");
      }
    }
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
      {/* LEFT PANE: BRANDING & ILLUSTRATION */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-16">
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
              <p className="text-sm font-bold">Encrypted Data</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Info className="h-5 w-5 mb-2 text-blue-300" />
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Status</p>
              <p className="text-sm font-bold">Production Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: AUTH FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 min-h-svh relative">
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
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative">
            <div className="absolute -top-1 -right-1 bg-blue-50 text-blue-600 px-6 py-2 rounded-bl-3xl font-black text-[9px] uppercase tracking-widest border-l border-b border-blue-100 flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> Demo Mode
            </div>

            <div className="text-center mb-8">
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
                {settings?.companyName || "WarriorERP"}
              </h2>
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
                <p className="text-sm font-bold text-blue-600 animate-pulse uppercase tracking-widest">Entering Terminal...</p>
              </div>
            ) : (
              <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 bg-slate-50 p-1 rounded-xl mb-6">
                  <TabsTrigger value="login" className="rounded-lg text-[10px] font-black uppercase tracking-widest h-9">
                    {t('login')}
                  </TabsTrigger>
                  <TabsTrigger value="register" className="rounded-lg text-[10px] font-black uppercase tracking-widest h-9">
                    Register
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          id="email" 
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
                          id="password" 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('password')}
                          className="pl-11 h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium border-slate-100 text-sm" 
                          required
                        />
                      </div>
                    </div>
                    
                    {authMode === 'login' && (
                      <div className="flex items-center justify-between pt-1 px-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="remember" className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600" />
                          <label htmlFor="remember" className="text-[10px] text-slate-500 font-bold cursor-pointer select-none uppercase">
                            {t('remember_me')}
                          </label>
                        </div>
                        <button type="button" className="text-[10px] text-blue-600 font-bold uppercase hover:underline">
                          {t('forgot_password')}
                        </button>
                      </div>
                    )}
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
                        {authMode === 'login' ? <ArrowRight className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                        {authMode === 'login' ? t('login') : 'Register Demo User'}
                      </>
                    )}
                  </Button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-100" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
                      <span className="bg-white px-4 text-slate-400">Secure Access</span>
                    </div>
                  </div>

                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full h-14 rounded-2xl gap-3 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 font-bold transition-all text-slate-600 text-sm" 
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                    Guest Administrator
                  </Button>
                </form>
              </Tabs>
            )}
          </div>

          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <p className="text-[9px] font-bold text-blue-700 uppercase leading-relaxed">
              TIP: If you haven't created your demo account yet, use the <span className="underline">Register</span> tab with <span className="underline">{email}</span> / <span className="underline">{password}</span>.
            </p>
          </div>

          <footer className="text-center pb-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              Warrior Tech System &copy; {new Date().getFullYear()} <br/>
              Next-Gen ERP Ecosystem
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
