
'use client';

import { useTenant } from '@/context/tenant-context';
import { translations } from '@/lib/translations';

export function useTranslation() {
  const { language } = useTenant();

  const t = (key: keyof typeof translations['EN']) => {
    return translations[language][key] || translations['EN'][key] || key;
  };

  return { t, language };
}
