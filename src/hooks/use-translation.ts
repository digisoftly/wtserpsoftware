'use client';

import { useTenant } from '@/context/tenant-context';
import { translations } from '@/lib/translations';

export function useTranslation() {
  const { language } = useTenant();

  const t = (key: keyof typeof translations['EN']) => {
    // Safely determine the language to use, defaulting to 'EN' if the current one is invalid
    const safeLang = (language && translations[language as keyof typeof translations]) 
      ? (language as keyof typeof translations) 
      : 'EN';
    
    const dictionary = translations[safeLang];
    
    // Return translation from current language, fallback to EN if missing, or return the key itself
    return (dictionary && dictionary[key]) || (translations['EN'] && translations['EN'][key]) || key;
  };

  return { t, language };
}
