
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useRouter, usePathname } from 'next/navigation';

/**
 * An intelligent listener that catches Firestore errors and displays a user-friendly modal
 * using simple language strings instead of technical codes.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // SUPPRESS ERRORS ON LOGIN PAGE TO PREVENT REDIRECT LOOPS OR DISTRACTIONS
      if (pathname === '/login' || pathname === '/login/') return;
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, [pathname]);

  if (!error) return null;

  /**
   * Maps internal Firestore context to a human-readable translation key.
   */
  const getFriendlyMessageKey = () => {
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
        <DialogHeader className="bg-red-600 p-6 text-white flex-row items-center gap-4 space-y-0">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">
              {t('errors.accessRestricted')}
            </DialogTitle>
            <p className="text-[10px] font-black uppercase opacity-70 tracking-widest mt-0.5">
              Terminal Protection Active
            </p>
          </div>
        </DialogHeader>
        
        <div className="p-8 space-y-6">
          <div className="text-center space-y-3">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
               <AlertCircle className="h-8 w-8" />
             </div>
             <h3 className="text-sm font-black text-slate-900 leading-tight uppercase px-4">
               {t(`errors.${messageKey}`)}
             </h3>
             <p className="text-xs font-medium text-slate-500">
               {t('errors.detailsSub')}
             </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
            <Button 
              variant="outline"
              onClick={() => { setError(null); router.back(); }} 
              className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200"
            >
              {t('common.back')}
            </Button>
            <Button 
              onClick={() => { setError(null); router.push('/'); }} 
              className="bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-blue-100"
            >
              {t('common.goDashboard')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
