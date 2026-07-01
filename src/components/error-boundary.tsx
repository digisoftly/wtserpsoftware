'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Robust Error Boundary to prevent white screen crashes.
 * Catches runtime errors in the component tree and provides a recovery UI.
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
    // Log the error for developer awareness, but keep it clean.
    console.group('ERP Runtime Error');
    console.error('Error:', error);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-10">
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-xl w-full border border-slate-100 text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center text-red-600 ring-8 ring-red-50/50 animate-pulse">
                <AlertCircle className="h-12 w-12" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-black font-headline text-slate-900 uppercase tracking-tight">System Interruption</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                The terminal encountered an unexpected runtime error. This is often caused by temporary connectivity issues or missing configuration.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-slate-900 text-red-400 p-4 rounded-2xl text-left text-xs font-mono overflow-auto max-h-32 custom-scrollbar">
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 gap-3"
              >
                <RefreshCw className="h-4 w-4" /> Reload Terminal
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'} 
                className="h-14 rounded-2xl font-black uppercase text-xs tracking-widest border-slate-200 gap-3"
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
