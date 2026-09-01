
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ZapOff, Fingerprint, ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/firebase';
import { cn } from '@/lib/utils';

/**
 * An intelligent listener that catches Firestore errors and displays a user-friendly modal.
 * Optimized for high-density mobile and tablet screens.
 * Silent during logout and on login pages to prevent permission-error noise.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { t } = useTranslation();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // 1. Global Silence: If no user is logged in, or we are on login page, ignore permission errors
      // This specifically fixes the "FirebaseError: Missing or insufficient permissions" on logout.
      if (!auth.currentUser) return;
      const normalizedPath = pathname?.replace(/\/$/, '') || '';
      if (normalizedPath === '/login') return;

      setError(error);
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, [pathname, auth.currentUser]);

  if (!error) return null;

  const isQuotaError = error.message?.toLowerCase().includes('resource-exhausted') || 
                       error.request?.method === 'resource-exhausted';

  const getFriendlyMessageKey = () => {
    if (isQuotaError) return "systemOverloaded";
    
    const path = error.request?.path || "";
    const method = error.request?.method || "";

    if (path.includes('users')) return "identitySync";
    if (path.includes('config')) return "systemConfig";
    if (path.includes('roles')) return "roleAuthority";
    
    if (method === 'create') return "createRestricted";
    if (method === 'update') return "updateRestricted";
    if (method === 'delete') return "deleteRestricted";
    
    return "genericBlocked";
  };

  const messageKey = getFriendlyMessageKey();

  return (
    <Dialog open={!!error} onOpenChange={() => setError(null)}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[1.5rem] md:rounded-[2.5rem] bg-white">
        <DialogHeader className={cn("p-6 md:p-8 text-white flex flex-col md:flex-row items-center gap-4 md:gap-5 space-y-0", isQuotaError ? "bg-amber-600" : "bg-slate-900")}>
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            {isQuotaError ? <ZapOff className="h-6 w-6 md:h-8 md:w-8" /> : <ShieldAlert className="h-6 w-6 md:h-8 md:w-8 text-red-500" />}
          </div>
          <div className="text-center md:text-left">
            <DialogTitle className="text-xl md:text-2xl font-black font-headline uppercase tracking-tight">
              {isQuotaError ? t('quotaExceeded') : "Gate Restricted"}
            </DialogTitle>
            <DialogDescription className="text-[8px] md:text-[10px] font-black uppercase opacity-60 tracking-[0.3em] mt-1">
              Terminal Protection Active
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="p-6 md:p-8 space-y-6 md:space-y-8">
          <div className="text-center space-y-3 md:space-y-4">
             <div className={cn("w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-2 shadow-inner", isQuotaError ? "bg-amber-50 text-amber-500" : "bg-red-50 text-red-500")}>
               <Fingerprint className="h-8 w-8 md:h-10 md:w-10" />
             </div>
             <h3 className="text-sm md:text-base font-black text-slate-900 leading-tight uppercase px-2">
               {t(messageKey)}
             </h3>
             <p className="text-[11px] md:text-xs font-medium text-slate-500 leading-relaxed px-2">
               {isQuotaError ? t('quotaSub') : "Access to this database segment has been restricted by system policy. Please verify your administrative credentials or contact support."}
             </p>
          </div>

          {!isQuotaError && (
            <div className="bg-slate-50 p-4 rounded-xl md:rounded-2xl border border-slate-100 space-y-2">
               <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 tracking-widest">Transaction Context</p>
               <p className="text-[9px] md:text-[10px] font-mono font-bold text-slate-600 truncate break-all">Path: {error.request?.path}</p>
               <p className="text-[9px] md:text-[10px] font-mono font-bold text-slate-600">Method: {error.request?.method.toUpperCase()}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-2">
            <Button 
              variant="outline"
              onClick={() => { setError(null); router.back(); }} 
              className="h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest border-slate-200 hover:bg-slate-50 gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> {t('back')}
            </Button>
            <Button 
              onClick={() => { setError(null); router.push('/'); }} 
              className="bg-slate-900 hover:bg-slate-800 h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest text-white shadow-xl gap-2"
            >
              <Home className="h-4 w-4" /> Terminal Root
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
