
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Building2, Lock, Mail, Languages, AlertCircle, Eye, EyeOff, Zap, Loader2, ArrowRight } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useTranslation } from '@/hooks/use-translation';
import { useTenant } from '@/context/tenant-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { seedMasterData } from '@/lib/seed-data';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
        setAuthError("Credential mismatch. Please run 'System Bootstrap' if this is a new installation.");
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
      // 1. Provision Auth Identity
      const secondaryName = `prod-init-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryName);
      const secondaryAuth = (await import('firebase/auth')).getAuth(secondaryApp);
      
      let uid;
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, 'warriortechsystem@gmail.com', 'admin123');
        uid = cred.user.uid;
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
          await signInWithEmailAndPassword(auth, 'warriortechsystem@gmail.com', 'admin123');
          uid = auth.currentUser?.uid;
        } else throw e;
      }

      if (!auth.currentUser) {
        await signInWithEmailAndPassword(auth, 'warriortechsystem@gmail.com', 'admin123');
        uid = auth.currentUser?.uid;
      }

      if (!uid) throw new Error("Auth sync failed.");

      // 2. Seed Master Structure
      await seedMasterData(db, companyId);

      // 3. Create Super Admin Profile
      const userRef = doc(db, "companies", companyId, "users", uid);
      const profileData = {
        id: uid,
        email: 'warriortechsystem@gmail.com',
        fullName: 'Warrior System Admin',
        firstName: 'Warrior',
        lastName: 'Admin',
        roleId: 'super-admin',
        status: 'active',
        branchId: 'dhaka-main',
        allowedBranches: ['dhaka-main'],
        preferredLanguage: 'BN',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, profileData).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: profileData
        }));
      });

      // 4. Create Initial Branch
      const branchRef = doc(db, "companies", companyId, "branches", "dhaka-main");
      const branchData = {
        id: "dhaka-main",
        branchName: "Head Office (Main)",
        branchCode: "HQ-001",
        status: "active",
        createdAt: serverTimestamp()
      };

      await setDoc(branchRef, branchData).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: branchRef.path,
          operation: 'create',
          requestResourceData: branchData
        }));
      });

      toast({ title: "System Ready", description: "Production environment initialized." });
      router.push('/');
    } catch (error: any) {
      setAuthError(`Bootstrap Error: ${error.message}`);
    } finally {
      setIsBootstrapping(false);
    }
  };

  if (!mounted) return null;
  const loginHero = PlaceHolderImages.find(img => img.id === 'login-hero');

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-y-auto">
      <div className="flex flex-col min-h-screen lg:flex-row items-stretch">
        <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950" />
          {loginHero && (
            <div className="absolute inset-0 opacity-10 mix-blend-overlay">
              <Image src={loginHero.imageUrl} alt="Warrior ERP" fill className="object-cover" priority data-ai-hint="enterprise business" />
            </div>
          )}
          <div className="relative z-10 text-white text-center space-y-10">
            <div className="w-24 h-24 rounded-[2rem] bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center mx-auto shadow-2xl animate-in zoom-in duration-700">
              <Building2 className="h-12 w-12 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-6xl font-black font-headline tracking-tighter leading-none">
                {settings?.companyName || "WarriorERP"}
              </h1>
              <p className="text-xl text-blue-100/60 font-medium tracking-widest uppercase">Enterprise Resource Planning</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-blue-100 border border-slate-100">
            <div className="text-center">
              <h2 className="text-2xl font-black font-headline text-slate-900 uppercase">System Login</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Authorized Access Point</p>
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
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 pl-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold focus:ring-2 focus:ring-blue-600" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 pl-12 pr-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold focus:ring-2 focus:ring-blue-600" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-blue-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isLoading || isBootstrapping} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowRight className="h-5 w-5 mr-2" /> Sign-in to Terminal</>}
              </Button>

              <div className="pt-6 flex flex-col items-center gap-4 border-t border-slate-50">
                <Button variant="ghost" type="button" onClick={handleBootstrap} disabled={isBootstrapping || isLoading} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 gap-2">
                  {isBootstrapping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  Synchronize System Bootstrap
                </Button>
                
                <Button variant="ghost" size="sm" type="button" className="rounded-full gap-2 text-slate-400" onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}>
                  <Languages className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase">{language === 'EN' ? 'বাংলা' : 'English'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
