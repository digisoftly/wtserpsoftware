"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Scan, Search, Barcode, Plus, Loader2, MoreVertical, CheckCircle2, History, AlertCircle, FileText, Trash2, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function SerialInventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const serialsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "serial_numbers"), 
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: serials, isLoading: isSerialsLoading } = useCollection(serialsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  const stats = React.useMemo(() => ({
    total: serials?.length || 0,
    available: serials?.filter(s => s.status === 'available').length || 0,
    sold: serials?.filter(s => s.status === 'sold').length || 0,
    service: serials?.filter(s => ['under_service', 'damaged'].includes(s.status)).length || 0
  }), [serials]);

  const handleDelete = async (id: string) => {
    if (!db || !companyId || !branchId) return;
    try {
      await deleteDoc(doc(db, "companies", companyId, "branches", branchId, "serial_numbers", id));
      toast({ title: t('success') });
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error') });
    }
  };

  const filteredSerials = React.useMemo(() => {
    return serials?.filter(s => {
      const matchesSearch = s.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [serials, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl font-bold font-headline text-purple-600 uppercase tracking-tight">{t('serialTracking')}</h1>
        <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-8 shadow-xl shadow-purple-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" asChild>
          <Link href="/serial-inventory/new">
            <Plus className="h-4 w-4" /> {t('addSerial')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('totalSerials')} value={stats.total} icon={Barcode} colorClass="bg-blue-600" />
        <KPICard title={t('available')} value={stats.available} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title={t('sold')} value={stats.sold} icon={History} colorClass="bg-purple-600" />
        <KPICard title={t('underService')} value={stats.service} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-2xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder={t('verifySerial')} 
            className="h-10 pl-10 border-none bg-slate-50/50 rounded-xl text-xs font-bold" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-10 text-[10px] uppercase font-black rounded-xl border-none bg-slate-50 ring-1 ring-slate-100"><SelectValue placeholder={t('status')} /></SelectTrigger>
          <SelectContent className="rounded-xl shadow-2xl">
            <SelectItem value="all" className="text-xs font-bold">{t('viewAll')}</SelectItem>
            <SelectItem value="available" className="text-xs font-bold">{t('available')}</SelectItem>
            <SelectItem value="sold" className="text-xs font-bold">{t('sold')}</SelectItem>
            <SelectItem value="damaged" className="text-xs font-bold">{t('damaged')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isSerialsLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
      ) : serials && serials.length > 0 ? (
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-6">{t('itemDescription')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">S/N - ID</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                  <TableHead className="h-12 text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSerials?.map((s) => (
                  <TableRow key={s.id} className="h-16 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase text-slate-900 truncate max-w-[200px]">
                          {products?.find(p => p.id === s.productId)?.name || "Unknown Product"}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{products?.find(p => p.id === s.productId)?.brand}</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-mono font-black text-[11px] text-slate-900 uppercase tracking-wider">{s.serialNumber}</span></TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-[9px] uppercase font-black border-none h-5 px-2", s.status === 'available' ? "bg-green-50 text-green-700" : s.status === 'sold' ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700")}>{s.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
          <Barcode className="h-12 w-12 text-purple-200 mb-6" />
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">{t('noSales')}</p>
        </div>
      )}
    </div>
  )
}