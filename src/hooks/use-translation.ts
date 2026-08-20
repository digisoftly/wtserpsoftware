
'use client';

import { useTenant } from '@/context/tenant-context';
import { translations } from '@/lib/translations';
import { numberToWords } from '@/lib/number-to-words';

export function useTranslation() {
  const { language } = useTenant();
  const currentLang = language || 'BN';

  /**
   * Translates a key. Supports flat lookup and fallback.
   */
  const t = (path: string): string => {
    const dictionary = translations[currentLang as keyof typeof translations] as any;
    
    // 1. Direct key lookup (Standard)
    if (dictionary[path]) return dictionary[path];

    // 2. Dot notation fallback (for errors.xxx)
    const keys = path.split('.');
    let result: any = dictionary;
    for (const key of keys) {
      if (result === undefined || result === null || result[key] === undefined) {
        // Fallback to English
        let fallback: any = (translations['EN'] as any);
        for (const fKey of keys) {
          fallback = fallback?.[fKey];
        }
        if (typeof fallback === 'object' || fallback === undefined) return path;
        return fallback;
      }
      result = result[key];
    }
    
    if (typeof result === 'object' && result !== null) return path;
    
    return result || path;
  };

  /**
   * Formats numbers based on locale
   */
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(currentLang === 'BN' ? 'bn-BD' : 'en-US').format(num || 0);
  };

  /**
   * Formats currency based on locale
   */
  const formatCurrency = (amount: number): string => {
    const symbol = currentLang === 'BN' ? '৳' : 'BDT ';
    const formatted = new Intl.NumberFormat(currentLang === 'BN' ? 'bn-BD' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
    return `${symbol}${formatted}`;
  };

  /**
   * Formats date based on locale
   */
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

  /**
   * Converts numeric amount to words in current language
   */
  const amountToWords = (amount: number): string => {
    return numberToWords(amount || 0, currentLang as 'EN' | 'BN');
  };

  return { t, language: currentLang, formatNumber, formatCurrency, formatDate, amountToWords };
}
