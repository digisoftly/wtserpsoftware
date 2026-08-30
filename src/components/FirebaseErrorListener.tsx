
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertCircle, ZapOff, Fingerprint } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useRouter, usePathname } from 'next/navigation';

/**
 * An intelligent listener that catches Firestore errors and displays a user-friendly modal.
 * Now includes detailed context for super-admins to identify missing rules.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      if (pathname === '/login' || pathname === '/login/') return;
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, [pathname]);

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
      <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
        <DialogHeader className={cn("p-8 text-white flex-row items-center gap-5 space-y-0", isQuotaError ? "bg-amber-600" : "bg-slate-900")}>
          <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            {isQuotaError ? <ZapOff className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8 text-red-500" />}
          </div>
          <div>
            <DialogTitle className="text-2xl font-black font-headline uppercase tracking-tight">
              {isQuotaError ? t('quotaExceeded') : "Gate Restricted"}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase opacity-60 tracking-[0.3em] mt-1">
              Terminal Protection Active
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="p-8 space-y-8">
          <div className="text-center space-y-4">
             <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-2 shadow-inner", isQuotaError ? "bg-amber-50 text-amber-500" : "bg-red-50 text-red-500")}>
               <Fingerprint className="h-10 w-10" />
             </div>
             <h3 className="text-base font-black text-slate-900 leading-tight uppercase px-4">
               {t(messageKey)}
             </h3>
             <p className="text-xs font-medium text-slate-500 leading-relaxed">
               {isQuotaError ? t('quotaSub') : "Access to this database segment has been restricted by system policy. Please verify your administrative credentials."}
             </p>
          </div>

          {!isQuotaError && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
               <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Transaction Context</p>
               <p className="text-[10px] font-mono font-bold text-slate-600 truncate">Path: {error.request?.path}</p>
               <p className="text-[10px] font-mono font-bold text-slate-600">Method: {error.request?.method.toUpperCase()}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button 
              variant="outline"
              onClick={() => { setError(null); router.back(); }} 
              className="h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest border-slate-200 hover:bg-slate-50"
            >
              {t('back')}
            </Button>
            <Button 
              onClick={() => { setError(null); router.push('/'); }} 
              className="bg-slate-900 hover:bg-slate-800 h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest text-white shadow-2xl shadow-slate-200"
            >
              Terminal Root
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
