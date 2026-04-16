"use client"

import * as React from "react"
import { Plus, Wrench, ShieldCheck, Loader2, MoreVertical, Calendar, FileCheck, Clock, AlertCircle, TrendingUp, Receipt, Edit, Trash2, Eye, Download, FilePlus, Zap } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, runTransaction, setDoc, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function ContractsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = React.useState(false);
  const [isEditInvoiceModalOpen, setIsEditInvoiceModalOpen] = React.useState(false);
  const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [isDeleteInvoiceAlertOpen, setIsDeleteInvoiceAlertOpen] = React.useState(false);
  
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [customerMode, setCustomerType] = React.useState<"select" | "new">("select");

  const [formTotalAmount, setFormTotalAmount] = React.useState<number>(0);
  const [formMonthlyAmount, setFormMonthlyAmount] = React.useState<number>(0);
  const [formDuration, setFormDuration] = React.useState<number>(12);

  const contractsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "service_contracts"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: contracts, isLoading: isContractsLoading } = useCollection(contractsQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "contract_invoices"), orderBy("billingMonth", "desc"));
  }, [db, companyId, branchId]);
  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  const stats = React.useMemo(() => ({
    active: contracts?.filter(c => c.status === 'active').length || 0,
    revenue: contracts?.filter(c => c.status === 'active').reduce((s, c) => s + (Number(c.monthlyAmount) || 0), 0) || 0,
    due: invoices?.filter(i => i.status !== 'paid').length || 0
  }), [contracts, invoices]);

  const resetForm = () => {
    setSelectedRecord(null);
    setCustomerType("select");
    setFormTotalAmount(0);
    setFormMonthlyAmount(0);
    setFormDuration(12);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl font-bold font-headline text-emerald-600">Service Contracts</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full h-9 text-[10px] uppercase font-bold px-6 ring-1 ring-emerald-100 border-none shadow-sm" disabled={isGenerating}>
            <Zap className="h-3.5 w-3.5 mr-2" /> Batch Engine
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-full px-8 shadow-lg h-9 text-[10px] uppercase font-bold" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            <Plus className="h-4 w-4" /> New Contract
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Active Contracts" value={stats.active} icon={ShieldCheck} colorClass="bg-blue-600" subtext="Recurring service" />
        <KPICard title="Monthly Revenue" value={`৳${stats.revenue.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" subtext="Projected intake" />
        <KPICard title="Due Contracts" value={stats.due} icon={AlertCircle} colorClass="bg-red-600" subtext="Invoice alerts" />
      </div>

      <Tabs defaultValue="contracts" className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-10 ring-1 ring-slate-100">
          <TabsTrigger value="contracts" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-bold h-8">Agreements</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-bold h-8">Billing Cycle</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {isContractsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : contracts && contracts.length > 0 ? (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold h-9">ID</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold h-9">Service</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold h-9">Fee</TableHead>
                    <TableHead className="text-right h-9"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => (
                    <TableRow key={c.id} className="h-12 hover:bg-muted/10 transition-colors">
                      <TableCell className="font-bold text-xs uppercase">{c.contractNumber}</TableCell>
                      <TableCell>
                        <div className="font-bold text-xs">{c.serviceName}</div>
                        <div className="text-[9px] uppercase text-muted-foreground font-black">{c.serviceType}</div>
                      </TableCell>
                      <TableCell className="font-black text-xs text-slate-900">৳{Number(c.monthlyAmount || 0).toLocaleString()}/mo</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem className="text-xs"><Eye className="mr-2 h-3.5 w-3.5" /> Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 text-xs"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="p-16 bg-white rounded-3xl border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <Wrench className="h-10 w-10 text-emerald-200 mb-4" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">No Active Agreements</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-emerald-600 p-6 text-white flex-row items-center gap-3">
            <ShieldCheck className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">New Agreement</DialogTitle>
          </DialogHeader>
          <div className="p-6 bg-slate-50 italic text-[10px] uppercase font-bold tracking-widest text-center py-20 text-muted-foreground">
            Contract Management Form
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
