
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowRight, Building2, Lock, Mail, Languages, Info, AlertCircle, Eye, EyeOff, Zap } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useTranslation } from '@/hooks/use-translation';
import { useTenant } from '@/context/tenant-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { seedMasterData } from '@/lib/seed-data';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const { settings } = useSettings();
  const { t, language } = useTranslation();
  const { setLanguage, userRole, companyId } = useTenant();
  const router = useRouter();
  
  const [email, setEmail] = React.useState('warriortechsystem@gmail.com');
  const [password, setPassword] = React.useState('admin123');
  const [showPassword, setShowPassword] = React.useState(false);
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [isBootstrapping, setIsBootstrapping] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (user && userRole) {
      setIsRedirecting(true);
      router.push('/');
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
        setAuthError("Account not found. If this is a new installation, please use the 'Initialize' option.");
      } else {
        setAuthError(error.message);
      }
    }
  };

  const handleBootstrap = async () => {
    if (!companyId || !db) return;
    setIsBootstrapping(true);
    setAuthError(null);

    try {
      // 1. Create Auth User via Secondary Instance to avoid session conflict
      const secondaryName = `init-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryName);
      const secondaryAuth = (await import('firebase/auth')).getAuth(secondaryApp);
      
      let uid;
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, 'warriortechsystem@gmail.com', 'admin123');
        uid = cred.user.uid;
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
          // If already in Auth, we just need to sign in normally
          await signInWithEmailAndPassword(auth, 'warriortechsystem@gmail.com', 'admin123');
          uid = auth.currentUser?.uid;
        } else throw e;
      }

      // 2. Ensure we are signed in on the primary app
      if (!auth.currentUser) {
        await signInWithEmailAndPassword(auth, 'warriortechsystem@gmail.com', 'admin123');
        uid = auth.currentUser?.uid;
      }

      if (!uid) throw new Error("Authentication failed during bootstrap.");

      // 3. Seed Master Data (Roles, Config)
      await seedMasterData(db, companyId);

      // 4. Create Super Admin Profile
      await setDoc(doc(db, "companies", companyId, "users", uid), {
        id: uid,
        email: 'warriortechsystem@gmail.com',
        fullName: 'System Super Admin',
        firstName: 'System',
        lastName: 'Admin',
        roleId: 'super-admin',
        status: 'active',
        branchId: 'dhaka-main',
        allowedBranches: ['dhaka-main'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({ title: "System Initialized", description: "Super Admin terminal is now ready." });
      router.push('/');
    } catch (error: any) {
      console.error(error);
      setAuthError(`Bootstrap Failed: ${error.message}`);
    } finally {
      setIsBootstrapping(false);
    }
  };

  if (!mounted) return null;
  const loginHero = PlaceHolderImages.find(img => img.id === 'login-hero');

  return (
    <div className="min-h-screen bg-slate-50 overflow-y-auto">
      <div className="flex flex-col min-h-screen lg:flex-row items-stretch">
        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
          {loginHero && (
            <div className="absolute inset-0 opacity-20 mix-blend-overlay">
              <Image src={loginHero.imageUrl} alt="Hero" fill className="object-cover" priority data-ai-hint={loginHero.imageHint} />
            </div>
          )}
          <div className="relative z-10 text-white text-center space-y-8">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto shadow-2xl">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-black font-headline tracking-tighter leading-none">
              {settings?.companyName || "WarriorERP"}
            </h1>
            <p className="text-xl text-blue-100/80 font-medium">Enterprise Resource Planning Ecosystem</p>
          </div>
        </div>

        {/* LOGIN FORM */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
            <div className="text-center">
              <h2 className="text-2xl font-black font-headline text-slate-900 uppercase">Terminal Access</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized Personnel Only</p>
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
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 pl-11 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 pl-11 pr-11 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-blue-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isLoading || isBootstrapping} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowRight className="h-5 w-5 mr-2" /> {t('login')}</>}
              </Button>

              <div className="pt-4 flex flex-col items-center gap-4">
                <Button variant="ghost" type="button" onClick={handleBootstrap} disabled={isBootstrapping || isLoading} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 gap-2">
                  {isBootstrapping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  Initialize System Bootstrap
                </Button>
                
                <Button variant="ghost" size="sm" type="button" className="rounded-full gap-2 text-slate-400" onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}>
                  <Languages className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase">{language === 'EN' ? 'বাংলা' : 'English'}</span>
                </Button>
              </div>
            </form>
          </div>

          <footer className="mt-8 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Warrior Tech System &copy; {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
