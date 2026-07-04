'use client';

import * as React from 'react';

/**
 * useBulkSelection provides logic for multi-item selection in tables.
 * Optimized with stable array conversion and automatic sync with source items.
 */
export function useBulkSelection<T extends { id: string }>(items: T[] | null | undefined) {
  const [selectedIdsSet, setSelectedIdsSet] = React.useState<Set<string>>(new Set());

  // Automatically remove IDs that are no longer in the items list (e.g. deleted elsewhere)
  React.useEffect(() => {
    if (!items) {
      if (selectedIdsSet.size > 0) setSelectedIdsSet(new Set());
      return;
    }
    
    const currentItemIds = new Set(items.map(i => i.id));
    setSelectedIdsSet(prev => {
      const next = new Set<string>();
      let hasChanges = false;
      prev.forEach(id => {
        if (currentItemIds.has(id)) {
          next.add(id);
        } else {
          hasChanges = true;
        }
      });
      if (hasChanges) return next;
      return prev;
    });
  }, [items]);

  const toggleSelect = React.useCallback((id: string) => {
    setSelectedIdsSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = React.useCallback(() => {
    if (!items) return;
    setSelectedIdsSet(prev => {
      if (prev.size === items.length && items.length > 0) return new Set();
      return new Set(items.map(i => i.id));
    });
  }, [items]);

  const clearSelection = React.useCallback(() => {
    setSelectedIdsSet(new Set());
  }, []);

  const selectedIdsArray = React.useMemo(() => Array.from(selectedIdsSet), [selectedIdsSet]);

  return {
    selectedIds: selectedIdsArray,
    isAllSelected: items ? selectedIdsSet.size === items.length && items.length > 0 : false,
    isSomeSelected: selectedIdsSet.size > 0,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    selectedCount: selectedIdsSet.size,
  };
}
