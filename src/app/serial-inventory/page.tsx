"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { 
  Scan, 
  Search, 
  Barcode, 
  Plus, 
  Loader2, 
  MoreVertical, 
  CheckCircle2, 
  History, 
  AlertCircle,
  FileText,
  Boxes,
  Trash2,
  ExternalLink,
  X
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, setDoc, writeBatch, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function SerialInventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();

  // UI State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [targetProductId, setTargetProductId] = React.useState("");
  const [rawSerials, setRawSerials] = React.useState("");

  // Queries
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

  // Stats
  const stats = React.useMemo(() => ({
    total: serials?.length || 0,
    available: serials?.filter(s => s.status === 'available').length || 0,
    sold: serials?.filter(s => s.status === 'sold').length || 0,
    service: serials?.filter(s => ['under_service', 'damaged'].includes(s.status)).length || 0
  }), [serials]);

  const handleAddSerials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || !targetProductId || !rawSerials) return;

    setIsSubmitting(true);
    try {
      // Split serials by comma, newline, or space
      const snList = rawSerials
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (snList.length === 0) throw new Error("No serial numbers detected.");

      const batch = writeBatch(db);
      const colRef = collection(db, "companies", companyId, "branches", branchId, "serial_numbers");

      snList.forEach(sn => {
        const newDocRef = doc(colRef);
        batch.set(newDocRef, {
          id: newDocRef.id,
          companyId,
          branchId,
          productId: targetProductId,
          serialNumber: sn,
          status: "available",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      toast({ title: t('success'), description: `${snList.length} units registered.` });
      setIsAddModalOpen(false);
      setRawSerials("");
      setTargetProductId("");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-purple-600 uppercase tracking-tight">{t('serialTracking')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-full h-10 px-6 text-[10px] uppercase font-black border-none shadow-sm ring-1 ring-slate-200 transition-all active:scale-95"
            onClick={() => router.push('/inventory/bulk-add')}
          >
            <Scan className="h-4 w-4 mr-2" /> BULK INTAKE
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-8 shadow-xl shadow-purple-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" 
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> {t('addSerial')}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('totalSerials')} value={stats.total} icon={Barcode} colorClass="bg-blue-600" />
        <KPICard title={t('available')} value={stats.available} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title={t('sold')} value={stats.sold} icon={History} colorClass="bg-purple-600" />
        <KPICard title={t('underService')} value={stats.service} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      {/* Filters */}
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 text-[10px] uppercase font-black rounded-xl border-none bg-slate-50 ring-1 ring-slate-100 shadow-sm">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-2xl">
              <SelectItem value="all" className="text-xs font-bold">{t('viewAll')}</SelectItem>
              <SelectItem value="available" className="text-xs font-bold">{t('available')}</SelectItem>
              <SelectItem value="sold" className="text-xs font-bold">{t('sold')}</SelectItem>
              <SelectItem value="damaged" className="text-xs font-bold">{t('damaged')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
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
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('details')}</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Barcode className="h-3.5 w-3.5 text-purple-400" />
                        <span className="font-mono font-black text-[11px] text-slate-900 uppercase tracking-wider">{s.serialNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn(
                        "text-[9px] uppercase font-black border-none h-5 px-2",
                        s.status === 'available' ? "bg-green-50 text-green-700" : 
                        s.status === 'sold' ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                      )}>
                        {t(`${s.status}_status` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.status === 'sold' ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-muted-foreground uppercase">Linked Sale</span>
                          <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                            <FileText className="h-3 w-3" /> {s.salesInvoiceId?.slice(-6) || "INV-DATA"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 italic">No activity</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 transition-colors opacity-0 group-hover:opacity-100">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-purple-50 text-purple-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold"><History className="mr-2 h-3.5 w-3.5" /> View Timeline</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => handleDelete(s.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* ADD/MULTI-ADD DIALOG */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50">
          <DialogHeader className="bg-purple-600 p-6 text-white flex-row items-center gap-4 space-y-0">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">{t('addSerial')}</DialogTitle>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">{t('initialize')}</p>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleAddSerials} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('addProduct')}</Label>
                <Select value={targetProductId} onValueChange={setTargetProductId} required>
                  <SelectTrigger className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-purple-600">
                    <SelectValue placeholder={t('search')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-2xl">
                    {products?.filter(p => p.serialNumberTrackingRequired).map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs font-bold">
                        <div className="flex flex-col">
                          <span>{p.name}</span>
                          <span className="text-[8px] uppercase text-muted-foreground">{p.sku} | STOCK: {p.currentStock}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Serial / IMEI List</Label>
                  <Badge className="bg-purple-50 text-purple-600 text-[8px] font-black h-4 px-1.5 uppercase border-none">MULTI-INPUT SUPPORT</Badge>
                </div>
                <Textarea 
                  placeholder="Scan or paste serials here. Separate with comma or enter..."
                  className="min-h-[150px] rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-purple-600 font-mono text-xs uppercase"
                  value={rawSerials}
                  onChange={e => setRawSerials(e.target.value)}
                  required
                />
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                  Example: SN-001, SN-002, SN-003...
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3 text-purple-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-tight">Units Detected</span>
              </div>
              <span className="text-2xl font-black font-headline text-slate-900">
                {rawSerials.split(/[\n,]+/).filter(s => s.trim().length > 0).length}
              </span>
            </div>

            <DialogFooter className="pt-4 border-t gap-3 flex-col sm:flex-row">
              <Button type="button" variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-8" onClick={() => setIsAddModalOpen(false)}>{t('cancel')}</Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !targetProductId || !rawSerials} 
                className="bg-purple-600 hover:bg-purple-700 rounded-full px-12 h-14 font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-purple-100 transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
