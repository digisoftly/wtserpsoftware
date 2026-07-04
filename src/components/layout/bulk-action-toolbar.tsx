'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  Printer, 
  Download, 
  X, 
  Zap, 
  ChevronUp, 
  MoreVertical,
  Copy,
  Tag,
  Share2,
  CheckCircle2,
  History,
  Loader2
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onAction: (action: string) => void;
  isLoading?: boolean;
}

/**
 * BulkActionToolbar is a floating bar for multi-item operations.
 */
export function BulkActionToolbar({ selectedCount, onClear, onAction, isLoading }: BulkActionToolbarProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 text-white rounded-full px-6 py-3 flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-black">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : selectedCount}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
            {t('itemsSelected')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isLoading} className="rounded-full bg-white text-slate-900 hover:bg-slate-100 h-10 px-6 gap-2 font-black text-[10px] uppercase shadow-xl transition-all active:scale-95">
                <Zap className="h-4 w-4 fill-current" />
                <span className="hidden md:inline">{t('bulkActions')}</span>
                <span className="md:hidden">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56 mb-4 rounded-[1.5rem] shadow-2xl p-2 border-slate-100">
              <DropdownMenuItem className="rounded-xl h-11 text-xs font-bold" onSelect={() => onAction('view')}>
                <Zap className="mr-2 h-4 w-4" /> {t('view')}
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl h-11 text-xs font-bold" onSelect={() => onAction('print')}>
                <Printer className="mr-2 h-4 w-4" /> {t('printSelected')}
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl h-11 text-xs font-bold" onSelect={() => onAction('download')}>
                <Download className="mr-2 h-4 w-4" /> {t('downloadSelected')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-50" />
              <DropdownMenuItem className="rounded-xl h-11 text-xs font-bold" onSelect={() => onAction('status')}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> {t('changeStatus')}
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl h-11 text-xs font-bold" onSelect={() => onAction('tags')}>
                <Tag className="mr-2 h-4 w-4" /> {t('addTags')}
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl h-11 text-xs font-bold" onSelect={() => onAction('duplicate')}>
                <Copy className="mr-2 h-4 w-4" /> {t('duplicateSelected')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-50" />
              <DropdownMenuItem className="rounded-xl h-11 text-xs font-bold text-red-600 focus:bg-red-50 focus:text-red-700" onSelect={() => onAction('delete')}>
                <Trash2 className="mr-2 h-4 w-4" /> {t('deleteSelected')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={onClear} disabled={isLoading} className="h-10 w-10 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
