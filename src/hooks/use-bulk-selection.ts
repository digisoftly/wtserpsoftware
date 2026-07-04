
'use client';

import * as React from 'react';

/**
 * useBulkSelection provides logic for multi-item selection in tables.
 */
export function useBulkSelection<T extends { id: string }>(items: T[] | null | undefined) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const toggleSelect = React.useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = React.useCallback(() => {
    if (!items) return;
    setSelectedIds(prev => {
      if (prev.size === items.length) return new Set();
      return new Set(items.map(i => i.id));
    });
  }, [items]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = items ? selectedIds.size === items.length && items.length > 0 : false;
  const isSomeSelected = selectedIds.size > 0;

  return {
    selectedIds: Array.from(selectedIds),
    isAllSelected,
    isSomeSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    selectedCount: selectedIds.size,
  };
}
