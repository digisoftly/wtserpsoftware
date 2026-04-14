
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowRight, Building2, Lock, Mail, Languages } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useTranslation } from '@/hooks/use-translation';
import { useTenant } from '@/context/tenant-context';

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
      // Role-based Intelligent Redirects
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
    <div className="min-h-screen flex items-stretch bg-background">
      {/* LEFT PANE: BRANDING & STATUS */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/erp/1200/800')] opacity-20 bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-blue-900" />
        
        <div className="relative z-10 max-w-lg text-white">
          <div className="w-24 h-24 rounded-3xl bg-white p-4 shadow-2xl mb-8">
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full rounded-2xl bg-primary flex items-center justify-center text-4xl font-bold">
                {settings?.companyName?.[0] || "W"}
              </div>
            )}
          </div>
          <h1 className="text-5xl font-bold font-headline leading-tight">
            {settings?.companyName || "WarriorERP"}
          </h1>
          <p className="text-xl text-primary-foreground/80 mt-4 leading-relaxed">
            Enterprise Resource Planning designed for the modern security and hardware industry.
          </p>
          
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <Building2 className="h-6 w-6 mb-2 opacity-80" />
              <p className="text-xs uppercase font-bold tracking-widest opacity-60">Status</p>
              <p className="font-bold">Active Branch</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <ShieldCheck className="h-6 w-6 mb-2 opacity-80" />
              <p className="text-xs uppercase font-bold tracking-widest opacity-60">Security</p>
              <p className="font-bold">ISO Certified</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: LOGIN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
        <div className="absolute top-8 right-8">
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full gap-2 text-muted-foreground"
            onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
          >
            <Languages className="h-4 w-4" />
            {language}
          </Button>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden">
                {settings?.companyLogo ? (
                  <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain p-2 bg-white" />
                ) : (
                  <span>{settings?.companyName?.[0] || "W"}</span>
                )}
              </div>
            </div>
            <h2 className="text-3xl font-bold font-headline">{t('loginTitle')}</h2>
            <p className="text-muted-foreground">{t('loginSub')}</p>
          </div>

          {isRedirecting ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in zoom-in duration-300">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm font-bold text-primary">{t('roleRedirecting')}</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('emailLabel')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="admin@warrior.com" className="pl-10 h-12 rounded-xl" disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t('passwordLabel')}</Label>
                    <button className="text-xs text-primary font-bold hover:underline">{t('forgotPassword')}</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" className="pl-10 h-12 rounded-xl" disabled />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label htmlFor="remember" className="text-xs text-muted-foreground font-medium cursor-pointer">
                    {t('rememberMe')}
                  </label>
                </div>
              </div>

              <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 gap-2" disabled>
                {t('signInBtn')} <ArrowRight className="h-5 w-5" />
              </Button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-background px-4 text-muted-foreground">{t('demoAccess')}</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-14 rounded-2xl gap-3 border-primary/20 hover:bg-primary/5 font-bold" 
                onClick={handleDemoLogin}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
                {t('guestAdmin')}
              </Button>
            </div>
          )}

          <footer className="text-center pt-8">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
              {settings?.companyName || "Warrior Tech System"} &copy; 2024. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
