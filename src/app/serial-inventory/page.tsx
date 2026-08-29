"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Scan, Search, Barcode, Plus, Loader2, MoreVertical, CheckCircle2, History, AlertCircle, FileText, Trash2, ExternalLink, ShieldCheck, MapPin, Calendar, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, deleteDoc, where, getDocs, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const { t, formatDate } = useTranslation();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [verifiedProduct, setVerifiedProduct] = React.useState<any>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);

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

  const handleVerifySerial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsVerifying(true);
    setVerifiedProduct(null);

    try {
      const q = query(
        collection(db!, "companies", companyId!, "branches", branchId!, "serial_numbers"),
        where("serialNumber", "==", searchTerm.trim()),
        limit(1)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        toast({ variant: "destructive", title: "Identity Failed", description: "This Serial Number is not registered in our system." });
      } else {
        const snData = snap.docs[0].data();
        const product = products?.find(p => p.id === snData.productId);
        setVerifiedProduct({ ...snData, productInfo: product });
        toast({ title: "Identity Verified", description: "Product match found in secure registry." });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScanKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifySerial();
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
        <div>
          <h1 className="text-xl font-bold font-headline text-purple-600 uppercase tracking-tight">{t('serialTracking')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Global Asset Authenticator</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-8 shadow-xl shadow-purple-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95 w-full md:w-auto" asChild>
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

      {/* VERIFICATION RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl rounded-[2rem] bg-slate-900 text-white overflow-hidden ring-1 ring-slate-800">
             <CardHeader className="bg-white/5 p-6 border-b border-white/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Scan className="h-4 w-4 text-purple-400" /> Verification Radar
                </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="relative group">
                   <Input 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={handleScanKeyDown}
                    className="h-14 bg-white/5 border-white/10 rounded-2xl pl-12 text-sm font-black uppercase tracking-tight focus:ring-purple-500 placeholder:text-white/20"
                    placeholder="Scan S/N QR Code..."
                   />
                   <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                </div>
                <Button 
                  onClick={() => handleVerifySerial()}
                  disabled={isVerifying || !searchTerm}
                  className="w-full h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                >
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initiate Verification"}
                </Button>
             </CardContent>
          </Card>

          {verifiedProduct && (
            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden animate-in fade-in zoom-in-95 duration-500 ring-4 ring-green-50">
               <div className="bg-green-600 p-4 text-center text-white flex flex-col items-center gap-1">
                  <ShieldCheck className="h-8 w-8" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Authenticated Product</p>
               </div>
               <CardContent className="p-8 space-y-6">
                  <div className="text-center">
                     <h3 className="text-xl font-black text-slate-900 uppercase leading-tight">{verifiedProduct.productInfo?.name}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Model: {verifiedProduct.productInfo?.sku}</p>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-slate-400">Current Status</span>
                        <Badge className={cn("h-5 px-2 border-none", verifiedProduct.status === 'available' ? "bg-green-50 text-green-700" : "bg-purple-50 text-purple-700")}>
                           {verifiedProduct.status}
                        </Badge>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-slate-400">Registry Date</span>
                        <span className="text-slate-900">{formatDate(verifiedProduct.createdAt)}</span>
                     </div>
                     {verifiedProduct.status === 'sold' && (
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 mt-4">
                          <div className="flex items-center gap-2 text-blue-600">
                             <User className="h-3.5 w-3.5" />
                             <span className="text-[9px] font-black uppercase">Deployment Details</span>
                          </div>
                          <p className="text-[11px] font-black text-slate-900 uppercase">{verifiedProduct.customerName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Sold on: {formatDate(verifiedProduct.saleDate)}</p>
                       </div>
                     )}
                  </div>
               </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-8">
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
            <div className="p-5 border-b flex items-center justify-between flex-wrap gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                     <Barcode className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase text-slate-900">Registry Ledger</h3>
               </div>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-[10px] uppercase font-black rounded-xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl shadow-2xl">
                  <SelectItem value="all" className="text-xs font-bold uppercase">All Units</SelectItem>
                  <SelectItem value="available" className="text-xs font-bold uppercase">Available</SelectItem>
                  <SelectItem value="sold" className="text-xs font-bold uppercase">Sold</SelectItem>
                  <SelectItem value="damaged" className="text-xs font-bold uppercase">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="h-12 text-[10px] font-black uppercase pl-8 text-slate-400">Inventory Item</TableHead>
                    <TableHead className="h-12 text-[10px] font-black uppercase text-slate-400">Registry S/N</TableHead>
                    <TableHead className="h-12 text-[10px] font-black uppercase text-slate-400 text-center">Status</TableHead>
                    <TableHead className="h-12 text-right pr-8 text-slate-400">Registry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSerialsLoading ? (
                    <TableRow><TableCell colSpan={4} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-200" /></TableCell></TableRow>
                  ) : filteredSerials?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-64 text-center text-slate-300 text-[10px] font-black uppercase italic tracking-widest">No matching units found</TableCell></TableRow>
                  ) : (
                    filteredSerials?.map((s) => (
                      <TableRow key={s.id} className="h-16 hover:bg-muted/5 transition-colors group">
                        <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <span className="font-black text-xs uppercase tracking-tight text-slate-900 truncate max-w-[200px]">
                              {products?.find(p => p.id === s.productId)?.name || "Unknown"}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{products?.find(p => p.id === s.productId)?.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell><span className="font-mono font-black text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{s.serialNumber}</span></TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn("text-[8px] uppercase font-black border-none h-5 px-2", 
                            s.status === 'available' ? "bg-green-50 text-green-700" : 
                            s.status === 'sold' ? "bg-purple-50 text-purple-700" : "bg-red-50 text-red-700")}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(s.createdAt)}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
