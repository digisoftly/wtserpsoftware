
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/use-settings';

/**
 * An intelligent listener that catches Firestore errors and displays a user-friendly modal.
 * It prevents white-screen crashes and technical details from reaching the end-user.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { t, language } = useTranslation();
  const { get_setting } = useSettings();
  const router = useRouter();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (!error) return null;

  const isPermissionError = error.message.includes('insufficient permissions') || error.request?.method === 'list' || error.request?.method === 'get';
  
  // Custom message lookup
  const customTitle = get_setting(`msgTitle_${isPermissionError ? 'permission' : 'system'}_${language}`, t(isPermissionError ? 'accessRestricted' : 'serverError'));
  const customBody = get_setting(`msgBody_${isPermissionError ? 'permission' : 'system'}_${language}`, t(isPermissionError ? 'accessRestrictedMsg' : 'serverErrorMsg'));

  return (
    <Dialog open={!!error} onOpenChange={() => setError(null)}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50">
        <DialogHeader className="bg-red-600 p-6 text-white flex-row items-center gap-4 space-y-0">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">{customTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="p-8 text-center space-y-6">
          <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
            {customBody}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              onClick={() => { setError(null); router.back(); }} 
              className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200 gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> {t('back')}
            </Button>
            <Button 
              onClick={() => { setError(null); router.push('/'); }} 
              className="bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-blue-100 gap-2"
            >
              <Home className="h-4 w-4" /> {t('goDashboard')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
