"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  Plus, 
  MapPin, 
  Phone, 
  User, 
  Search, 
  Loader2, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Globe, 
  Mail, 
  Building,
  Printer,
  Download,
  X,
  Save
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, setDoc, where } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/hooks/use-translation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export default function BranchesPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Queries
  const branchesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "branches"), orderBy("branchName"));
  }, [db, companyId]);

  const { data: branches, isLoading } = useCollection(branchesQuery);

  const branchTypesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, "companies", companyId, "master_data"), 
      where("type", "==", "branchTypes"),
      where("isActive", "==", true)
    );
  }, [db, companyId]);
  const { data: branchTypes } = useCollection(branchTypesQuery);

  const stats = React.useMemo(() => ({
    total: branches?.length || 0,
    active: branches?.filter(b => b.status === 'active').length || 0
  }), [branches]);

  const handleSaveBranch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const branchData = {
      branchName: formData.get("branchName") as string,
      branchCode: formData.get("branchCode") as string,
      branchType: formData.get("branchType") as string,
      contactPerson: formData.get("contactPerson") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      district: formData.get("district") as string,
      country: formData.get("country") as string,
      status: formData.get("status") === "on" ? "active" : "inactive",
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = selectedRecord 
        ? doc(db, "companies", companyId, "branches", selectedRecord.id) 
        : doc(collection(db, "companies", companyId, "branches"));
      
      await setDoc(docRef, {
        ...branchData,
        id: docRef.id,
        createdAt: selectedRecord ? selectedRecord.createdAt : serverTimestamp()
      }, { merge: true });

      toast({ title: t('success') });
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedRecord(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = () => {
    if (!selectedRecord || !db || !companyId) return;
    const docRef = doc(db, "companies", companyId, "branches", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
    setSelectedRecord(null);
  };

  const filteredBranches = branches?.filter(b => 
    b.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.branchCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-blue-600 uppercase tracking-tight">{t('branches')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Global Location Management</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2 rounded-full h-10 px-8 text-[10px] uppercase font-black shadow-xl shadow-blue-100 transition-all active:scale-95 w-full md:w-auto" onClick={() => { setSelectedRecord(null); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('addBranch')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title={t('totalBranches')} value={stats.total} icon={Building2} colorClass="bg-blue-600" />
        <KPICard title={t('activeBranches')} value={stats.active} icon={CheckCircle2} colorClass="bg-green-600" />
      </div>

      <div className="bg-white p-4 rounded-3xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-11 h-11 w-full rounded-2xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('branch')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('type')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">Contact</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                  <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[140px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches?.map((b) => (
                  <TableRow key={b.id} className="h-20 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase tracking-tight text-slate-900">{b.branchName}</span>
                        <span className="text-[10px] font-mono text-blue-600 font-bold mt-1">CODE: {b.branchCode}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] uppercase font-black border-none bg-slate-100 px-2 h-5">
                        {b.branchType || 'Branch'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                          <User className="h-3 w-3 opacity-40" /> {b.contactPerson || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Phone className="h-3 w-3 opacity-40" /> {b.phone || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn("text-[8px] h-4 uppercase font-black border-none px-2", b.status === 'active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                        {b.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedRecord(b); setIsEditModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-600"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold"><Printer className="mr-2 h-3.5 w-3.5" /> {t('print')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold"><Download className="mr-2 h-3.5 w-3.5" /> {t('downloadSelected')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => { setSelectedRecord(b); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
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
      )}

      {/* ADD/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedRecord(null); } }}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50 max-h-[96vh]">
          <DialogHeader className="bg-blue-600 p-6 text-white flex-row items-center gap-4 space-y-0">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">
                {isEditModalOpen ? t('editBranch') : t('newLocation')}
              </DialogTitle>
              <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] mt-0.5">Physical Node Terminal</p>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSaveBranch} className="p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar max-h-[calc(96vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Identity */}
              <div className="lg:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('branch')} Name *</Label>
                <Input name="branchName" required defaultValue={selectedRecord?.branchName} className="h-11 rounded-xl" placeholder="e.g. Dhaka Main Office" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Branch Code *</Label>
                <Input name="branchCode" required defaultValue={selectedRecord?.branchCode} className="h-11 rounded-xl uppercase font-mono" placeholder="DHK-001" />
              </div>

              {/* Classification */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Branch Type</Label>
                <Select name="branchType" defaultValue={selectedRecord?.branchType || "Head Office"}>
                  <SelectTrigger className="h-11 rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {branchTypes?.map(type => (
                      <SelectItem key={type.id} value={type.name} className="text-xs font-bold">{type.name}</SelectItem>
                    )) || (
                      <>
                        <SelectItem value="Head Office" className="text-xs font-bold">Head Office</SelectItem>
                        <SelectItem value="Sales Center" className="text-xs font-bold">Sales Center</SelectItem>
                        <SelectItem value="Warehouse" className="text-xs font-bold">Warehouse</SelectItem>
                        <SelectItem value="Service Point" className="text-xs font-bold">Service Point</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contact Person</Label>
                <Input name="contactPerson" defaultValue={selectedRecord?.contactPerson} className="h-11 rounded-xl" placeholder="Manager Name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('phone')}</Label>
                <Input name="phone" defaultValue={selectedRecord?.phone} className="h-11 rounded-xl" placeholder="+880..." />
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('email')}</Label>
                <Input name="email" type="email" defaultValue={selectedRecord?.email} className="h-11 rounded-xl" placeholder="branch@warrior.com" />
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border shadow-sm ring-1 ring-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black uppercase text-slate-900">{t('isActive')}</Label>
                  <p className="text-[9px] text-muted-foreground uppercase">Enable this location</p>
                </div>
                <Switch name="status" defaultChecked={selectedRecord?.status !== 'inactive'} className="data-[state=checked]:bg-blue-600" />
              </div>

              {/* Address */}
              <div className="lg:col-span-3 space-y-1.5 pt-4 border-t border-slate-200">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('address')}</Label>
                <textarea name="address" className="w-full min-h-[80px] rounded-xl bg-white border ring-1 ring-slate-200 p-4 text-xs resize-none" defaultValue={selectedRecord?.address} placeholder="Full street address..." />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">City</Label>
                <Input name="city" defaultValue={selectedRecord?.city} className="h-11 rounded-xl" placeholder="Dhaka" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">District</Label>
                <Input name="district" defaultValue={selectedRecord?.district} className="h-11 rounded-xl" placeholder="Dhaka" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Country</Label>
                <Input name="country" defaultValue={selectedRecord?.country || "Bangladesh"} className="h-11 rounded-xl" />
              </div>
            </div>
            
            <DialogFooter className="pt-6 border-t flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-slate-50 mt-auto">
              <Button type="button" variant="ghost" className="rounded-full px-8 h-12 text-[10px] font-black uppercase tracking-widest" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-full px-12 h-12 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 gap-2 transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">{t('errorSub')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={handleDeleteBranch}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
