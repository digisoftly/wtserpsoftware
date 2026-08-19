
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Home, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useRouter } from 'next/navigation';

/**
 * An intelligent listener that catches Firestore errors and displays a user-friendly modal
 * with short technical explanations.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, []);

  if (!error) return null;

  // Logic to generate short version error explanations
  const getShortError = () => {
    const path = error.request?.path || "";
    const method = error.request?.method || "";

    if (path.includes('users')) return "Identity Sync Error";
    if (path.includes('config')) return "System Config Blocked";
    if (path.includes('roles')) return "Authority Matrix Error";
    if (method === 'create') return "New Record Restricted";
    if (method === 'update') return "Modification Denied";
    if (method === 'delete') return "Removal Restricted";
    
    return "Operation Blocked";
  };

  return (
    <Dialog open={!!error} onOpenChange={() => setError(null)}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
        <DialogHeader className="bg-red-600 p-6 text-white flex-row items-center gap-4 space-y-0">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">Access Restricted</DialogTitle>
            <p className="text-[10px] font-black uppercase opacity-70 tracking-widest mt-0.5">{getShortError()}</p>
          </div>
        </DialogHeader>
        
        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
             <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
             <p className="text-xs font-bold text-slate-600 leading-relaxed">
               The terminal rejected this request due to insufficient authority or missing system setup.
             </p>
          </div>

          <div className="p-4 bg-slate-900 rounded-2xl space-y-2 overflow-hidden">
             <div className="flex items-center gap-2 text-white/40 mb-2">
                <Info className="h-3 w-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">Technical Log</span>
             </div>
             <p className="text-[10px] font-mono text-emerald-400 truncate">PATH: {error.request?.path || '---'}</p>
             <p className="text-[10px] font-mono text-blue-400 uppercase">ACTION: {error.request?.method || '---'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button 
              variant="outline"
              onClick={() => { setError(null); router.back(); }} 
              className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200"
            >
              Go Back
            </Button>
            <Button 
              onClick={() => { setError(null); router.push('/'); }} 
              className="bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-blue-100"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
