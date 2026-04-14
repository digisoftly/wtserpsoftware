
'use client';

import { useTenant } from '@/context/tenant-context';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Standard hook to access global ERP configurations.
 * Provides fallback values if settings are not yet initialized in Firestore.
 */
export function useSettings() {
  const { companyId } = useTenant();
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return doc(db, "companies", companyId, "system", "config");
  }, [db, companyId]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  const get_setting = (key: string, fallback: any = null) => {
    if (isLoading || !settings) return fallback;
    return settings[key] !== undefined ? settings[key] : fallback;
  };

  return {
    settings,
    isLoading,
    get_setting,
    // Convenience getters for common business rules
    taxRate: Number(get_setting('taxRate', 15)),
    currency: get_setting('currency', 'BDT'),
    currencySymbol: get_setting('currency', 'BDT') === 'BDT' ? '৳' : '$',
    invoicePrefix: get_setting('invoicePrefix', 'INV'),
    lowStockLevel: Number(get_setting('lowStockLevel', 5)),
    autoStockUpdate: get_setting('autoStockUpdate', true),
  };
}
