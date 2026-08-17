
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

export type Language = 'EN' | 'BN';

export const translations = {
  EN: en,
  BN: bn
} as const;

export type TranslationKey = string; // Using string to support dot notation like 'common.save'
