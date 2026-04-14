'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowRight, Building2, Lock, Mail, Languages, Info } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useTranslation } from '@/hooks/use-translation';
import { useTenant } from '@/context/tenant-context';
import Image from 'next/image';

export default function LoginPage() {
  const auth = useAuth();
  const { user } = useUser();
  const { settings } = useSettings();
  const { t, language } = useTranslation();
  const { setLanguage, userRole } = useTenant();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  React.useEffect(() => {
    if (user && userRole) {
      setIsRedirecting(true);
      const roleName = userRole.name.toLowerCase();
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

  const handleDemoLogin = () => {
    setIsLoading(true);
    initiateAnonymousSignIn(auth);
  };

  return (
    <div className="min-h-screen flex items-stretch bg-slate-50">
      {/* LEFT PANE: BRANDING & ILLUSTRATION */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-16">
        {/* Background Pattern/Illustration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <Image 
            src="https://picsum.photos/seed/erp-business/1200/1200" 
            alt="Business Illustration" 
            fill 
            className="object-cover"
            data-ai-hint="business analytics"
          />
        </div>
        
        <div className="relative z-10 max-w-md text-white text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 mb-8 shadow-2xl">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-black font-headline tracking-tighter leading-none mb-6">
            {settings?.companyName || "WarriorERP"}
          </h1>
          <p className="text-xl text-blue-100/80 font-medium leading-relaxed mb-12">
            A unified ecosystem for your security business. Manage sales, inventory, and field services in one powerful workspace.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 mb-2 text-blue-300" />
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Compliance</p>
              <p className="text-sm font-bold">Secure Access</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Info className="h-5 w-5 mb-2 text-blue-300" />
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Status</p>
              <p className="text-sm font-bold">Systems Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header Controls */}
          <div className="absolute top-8 right-8 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full gap-2 text-slate-500 hover:text-blue-600 transition-colors"
              onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
            >
              <Languages className="h-4 w-4" />
              {language === 'EN' ? 'বাংলা' : 'English'}
            </Button>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 p-2 flex items-center justify-center border border-slate-100 overflow-hidden shadow-inner">
                  {settings?.companyLogo ? (
                    <img src={settings.companyLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Building2 className="h-8 w-8 text-blue-600" />
                  )}
                </div>
              </div>
              <h2 className="text-3xl font-black font-headline tracking-tight text-slate-900 uppercase">
                WELCOME
              </h2>
              <p className="text-slate-500 mt-2 font-medium">Please enter your details to sign in</p>
            </div>

            {isRedirecting ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-sm font-bold text-blue-600 animate-pulse">{t('roleRedirecting')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('emailLabel')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="admin@warrior.com" 
                        className="pl-11 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                        disabled 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('passwordLabel')}</Label>
                      <button className="text-xs text-blue-600 font-bold hover:underline transition-all">{t('forgotPassword')}</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="password" 
                        type="password" 
                        className="pl-11 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" 
                        disabled 
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="remember" className="rounded-md border-slate-300" />
                    <label htmlFor="remember" className="text-sm text-slate-600 font-medium cursor-pointer select-none">
                      {t('rememberMe')}
                    </label>
                  </div>
                </div>

                <Button className="w-full h-14 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 gap-2 transition-all active:scale-95" disabled>
                  {t('signInBtn')} <ArrowRight className="h-5 w-5" />
                </Button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
                    <span className="bg-white px-4 text-slate-400">{t('demoAccess')}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full h-14 rounded-2xl gap-3 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 font-bold transition-all" 
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  {t('guestAdmin')}
                </Button>
              </div>
            )}
          </div>

          <footer className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              {settings?.companyName || "Warrior Tech System"} &copy; {new Date().getFullYear()} <br/>
              Enterprise Resource Planning Terminal
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
