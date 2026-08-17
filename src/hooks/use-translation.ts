'use client';

import { useTenant } from '@/context/tenant-context';
import { translations } from '@/lib/translations';

export function useTranslation() {
  const { language } = useTenant();
  const currentLang = language || 'BN';

  /**
   * Translates a key using dot notation (e.g., 'common.save')
   */
  const t = (path: string): string => {
    const dictionary = translations[currentLang as keyof typeof translations];
    const keys = path.split('.');
    
    let result: any = dictionary;
    for (const key of keys) {
      if (result === undefined || result === null || result[key] === undefined) {
        // Fallback to English if key missing in current language
        let fallback: any = (translations['EN'] as any);
        for (const fKey of keys) {
          fallback = fallback?.[fKey];
        }
        // If fallback also fails, return the path
        if (typeof fallback === 'object' || fallback === undefined) return path;
        return fallback;
      }
      result = result[key];
    }
    
    // Safety check: if result is an object, return the path to prevent React crash
    if (typeof result === 'object' && result !== null) return path;
    
    return result || path;
  };

  /**
   * Formats numbers based on locale
   */
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(currentLang === 'BN' ? 'bn-BD' : 'en-US').format(num);
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
    return currentLang === 'BN' ? `${symbol}${formatted}` : `${symbol}${formatted}`;
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

  return { t, language: currentLang, formatNumber, formatCurrency, formatDate };
}
