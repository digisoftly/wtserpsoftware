
'use client';

import * as React from 'react';
import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { useTranslation } from '@/hooks/use-translation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, LogOut, PlayCircle } from 'lucide-react';

/**
 * SessionTimeoutHandler renders the warning modal and initializes the timeout hook.
 */
export function SessionTimeoutHandler() {
  const { showWarning, resetTimer, handleLogout } = useSessionTimeout();
  const { t } = useTranslation();

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
        <DialogHeader className="bg-amber-500 p-6 text-white flex-row items-center gap-3 space-y-0">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Clock className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">
            {t('sessionExpiring')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-8 text-center space-y-6 bg-slate-50">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 animate-pulse">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </div>
          
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            {t('sessionExpiringSub')}
          </p>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={resetTimer} 
              className="bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 gap-2"
            >
              <PlayCircle className="h-4 w-4" /> {t('continueSession')}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200 gap-2 text-red-600 hover:bg-red-50 hover:border-red-100"
            >
              <LogOut className="h-4 w-4" /> {t('logoutNow')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
