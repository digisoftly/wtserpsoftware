'use client';

import * as React from 'react';
import { useTenant } from '@/context/tenant-context';
import { translations } from '@/lib/translations';
import { numberToWords } from '@/lib/number-to-words';

/**
 * Enhanced useTranslation hook with resilient key resolution and responsive currency formatting.
 * Handles dot notation, case-insensitivity, and smart fallbacks.
 */
export function useTranslation() {
  const { language } = useTenant();
  const currentLang = language || 'BN';

  const t = (path: string): string => {
    if (!path) return '';
    
    const dictionary = (translations[currentLang as keyof typeof translations] || translations['EN']) as any;
    const normalizedPath = path.toLowerCase();

    // Internal helper to find value with case-insensitivity and nesting support
    const findValue = (obj: any, p: string): any => {
      if (!obj) return null;
      
      // 1. Direct match
      if (obj[p]) return obj[p];
      
      // 2. Case-insensitive flat match
      const keys = Object.keys(obj);
      const foundKey = keys.find(k => k.toLowerCase() === p);
      if (foundKey) return obj[foundKey];
      
      // 3. Dot notation / Nesting support
      const parts = p.split('.');
      let current = obj;
      for (const part of parts) {
        if (!current || typeof current !== 'object') return null;
        const subKeys = Object.keys(current);
        const subKey = subKeys.find(k => k.toLowerCase() === part);
        if (!subKey) return null;
        current = current[subKey];
      }
      return current;
    };

    let result = findValue(dictionary, path);

    // Fallback to English if not found in current language
    if (!result && currentLang !== 'EN') {
      result = findValue(translations['EN'], path);
    }

    // Leaf node fallback: If "common.view" fails, try just "view"
    if (!result && path.includes('.')) {
      const leaf = path.split('.').pop() || '';
      result = findValue(dictionary, leaf);
      if (!result && currentLang !== 'EN') {
        result = findValue(translations['EN'], leaf);
      }
    }

    if (typeof result === 'string') return result;

    // Production Safe Fallback: Convert key to Human Readable string instead of showing dots
    const fallback = path.split('.').pop() || path;
    return fallback
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(currentLang === 'BN' ? 'bn-BD' : 'en-US').format(num || 0);
  };

  /**
   * Responsive Currency Formatter
   * Mobile/Tablet: ৳ [Amount]
   * Desktop: BDT [Amount]
   */
  const formatCurrency = (amount: number): React.ReactNode => {
    const formatted = new Intl.NumberFormat(currentLang === 'BN' ? 'bn-BD' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);

    return (
      <span className="inline-flex items-center whitespace-nowrap">
        {currentLang === 'BN' ? (
          <>৳&nbsp;{formatted}</>
        ) : (
          <>
            <span className="md:hidden">৳&nbsp;</span>
            <span className="hidden md:inline">BDT&nbsp;</span>
            {formatted}
          </>
        )}
      </span>
    );
  };

  const formatDate = (dateInput: string | Date | any): string => {
    if (!dateInput) return '---';
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : 
                   dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
                   
      return new Intl.DateTimeFormat(currentLang === 'BN' ? 'bn-BD' : 'en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return '---';
    }
  };

  const amountToWords = (amount: number): string => {
    return numberToWords(amount || 0, currentLang as 'EN' | 'BN');
  };

  return { t, language: currentLang, formatNumber, formatCurrency, formatDate, amountToWords };
}
