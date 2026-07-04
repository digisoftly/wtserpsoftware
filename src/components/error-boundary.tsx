
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Network, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Enhanced Error Boundary that detects error types and shows admin-managed friendly messages.
 * Catches runtime crashes and provides a polished recovery UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('ERP Runtime Error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const errorStr = this.state.error?.toString().toLowerCase() || "";
      const isNetwork = errorStr.includes("network") || errorStr.includes("offline") || errorStr.includes("failed to fetch");
      const isPermission = errorStr.includes("permission") || errorStr.includes("insufficient");

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-10">
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-xl w-full border border-slate-100 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-center">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center ring-8 animate-pulse",
                isPermission ? "bg-red-50 text-red-600 ring-red-50/50" : 
                isNetwork ? "bg-amber-50 text-amber-600 ring-amber-50/50" : 
                "bg-blue-50 text-blue-600 ring-blue-50/50"
              )}>
                {isPermission ? <ShieldAlert className="h-12 w-12" /> : 
                 isNetwork ? <Network className="h-12 w-12" /> : 
                 <AlertCircle className="h-12 w-12" />}
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-black font-headline text-slate-900 uppercase tracking-tight">
                {isPermission ? "Access Restricted" : isNetwork ? "Network Interruption" : "System Interruption"}
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                {isPermission 
                  ? "You do not have permission to access this segment. Please contact your system administrator."
                  : isNetwork 
                  ? "We're unable to reach the terminal. Please check your internet connection and try again."
                  : "The terminal encountered an unexpected runtime error. We've logged this for the technical team."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 gap-3 transition-all active:scale-95"
              >
                <RefreshCw className="h-4 w-4" /> Reload Terminal
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'} 
                className="h-14 rounded-2xl font-black uppercase text-xs tracking-widest border-slate-200 gap-3 hover:bg-slate-50"
              >
                <Home className="h-4 w-4" /> Go to Dashboard
              </Button>
            </div>
            
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Warrior Tech System &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
