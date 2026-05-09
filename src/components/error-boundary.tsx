'use client';

import * as React from 'react';

/**
 * Basic Error Boundary to catch crashes from FirebaseErrorListener
 * and prevent a complete white screen.
 */
export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 uppercase">System Error</h2>
            <p className="text-slate-500 mb-6 font-medium">A permissions or connectivity error occurred. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-blue-700 transition-all"
            >
              Reload Terminal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
