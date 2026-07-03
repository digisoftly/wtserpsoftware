
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { 
  Folder, 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  ClipboardCheck, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronRight,
  Target,
  User,
  MapPin,
  DollarSign,
  Wrench,
  AlertCircle,
  CheckCircle2,
  X,
  Package
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, setDoc, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProjectsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  // UI State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Queries
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "projects"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: projects, isLoading } = useCollection(projectsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  // Stats
  const stats = React.useMemo(() => ({
    total: projects?.length || 0,
    running: projects?.filter(p => p.status === 'active').length || 0,
    completed: projects?.filter(p => p.status === 'completed').length || 0,
    pending: projects?.filter(p => p.status === 'pending').length || 0,
    totalBudget: projects?.reduce((s, p) => s + (Number(p.budget) || 0), 0) || 0,
    paidAmount: projects?.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0) || 0,
  }), [projects]);

  const handleSaveProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId) return;
    
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const customerId = formData.get("customerId") as string;
    const customer = customers?.find(c => c.id === customerId);

    const projectData = {
      name: formData.get("name") as string,
      projectCode: isEditModalOpen ? selectedRecord.projectCode : `PRJ-${Date.now().toString().slice(-6)}`,
      customerId,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client",
      contactPerson: formData.get("contactPerson") || "",
      phone: formData.get("phone") || "",
      address: formData.get("address") || "",
      projectType: formData.get("projectType") || "General",
      startDate: formData.get("startDate") as string,
      deadline: formData.get("deadline") as string,
      priority: formData.get("priority") || "Medium",
      budget: Number(formData.get("budget")),
      projectCost: Number(formData.get("projectCost") || 0),
      expectedProfit: Number(formData.get("budget")) - Number(formData.get("projectCost") || 0),
      status: formData.get("status") || "pending",
      progress: Number(formData.get("progress") || 0),
      description: formData.get("description") || "",
      notes: formData.get("notes") || "",
      engineers: formData.get("engineers") || "",
      updatedAt: serverTimestamp(),
    };

    try {
      if (isEditModalOpen) {
        const docRef = doc(db, "companies", companyId, "branches", branchId, "projects", selectedRecord.id);
        await updateDoc(docRef, projectData);
      } else {
        const docRef = doc(collection(db, "companies", companyId, "branches", branchId, "projects"));
        await setDoc(docRef, { 
          ...projectData, 
          id: docRef.id, 
          companyId, 
          branchId, 
          paidAmount: 0,
          createdAt: serverTimestamp() 
        });
      }
      toast({ title: t('success') });
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedRecord(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (p: any) => {
    setSelectedRecord(p);
    setIsEditModalOpen(true);
  };

  const filteredProjects = projects?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.projectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-teal-600 uppercase tracking-tight">{t('projects')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-full px-8 shadow-xl shadow-teal-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95 w-full md:w-auto" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('addProject')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('running')} value={stats.running} icon={TrendingUp} colorClass="bg-teal-600" />
        <KPICard title={t('totalBilling')} value={`৳${stats.totalBudget.toLocaleString()}`} icon={DollarSign} colorClass="bg-blue-600" />
        <KPICard title={t('paidAmount')} value={`৳${stats.paidAmount.toLocaleString()}`} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title={t('dueAmount')} value={`৳${(stats.totalBudget - stats.paidAmount).toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-teal-500 transition-all outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('project')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('budget')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('progress')}</TableHead>
                  <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] w-[160px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects?.map((p) => (
                  <TableRow key={p.id} className="h-20 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase tracking-tight text-slate-900 truncate max-w-[200px]">{p.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                           <Badge variant="outline" className="text-[8px] font-mono h-4 border-none bg-slate-100 px-1 text-slate-500">{p.projectCode}</Badge>
                           <span className="text-[9px] font-bold text-muted-foreground uppercase">{p.projectType}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{p.customerName}</span>
                        <span className="text-[9px] font-medium text-slate-400 truncate max-w-[150px]">{p.address || "No Address"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn(
                        "text-[8px] h-5 uppercase border-none px-2 font-black",
                        p.status === 'completed' ? "bg-green-50 text-green-700" : 
                        p.status === 'active' ? "bg-teal-50 text-teal-700" : 
                        p.status === 'cancelled' ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700")}>
                        {t(`${p.status}_status` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-xs text-slate-900">৳{p.budget?.toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-red-500 uppercase">Due: ৳{(p.budget - (p.paidAmount || 0)).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                          <span>{p.progress || 0}%</span>
                        </div>
                        <Progress value={p.progress || 0} className="h-1 bg-slate-100" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                       <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" title={t('view')}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600 hover:bg-amber-50" onClick={() => openEdit(p)} title={t('edit')}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50" onClick={() => { setSelectedRecord(p); setIsDeleteAlertOpen(true); }} title={t('delete')}><Trash2 className="h-4 w-4" /></Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* PROJECT BUILDER DIALOG */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedRecord(null); } }}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50 max-h-[96vh]">
          <DialogHeader className="bg-teal-600 p-6 text-white flex-row items-center justify-between space-y-0 shrink-0">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                   <Folder className="h-6 w-6" />
                </div>
                <div>
                   <DialogTitle className="text-xl font-black font-headline uppercase tracking-tight">{isEditModalOpen ? t('edit') : t('addProject')}</DialogTitle>
                   <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mt-0.5">Project Lifecycle Terminal</p>
                </div>
             </div>
             {isEditModalOpen && <Badge variant="outline" className="border-white/20 text-white font-black text-[9px] uppercase px-3 py-1 rounded-full">{selectedRecord?.projectCode}</Badge>}
          </DialogHeader>

          <form onSubmit={handleSaveProject} className="flex flex-col overflow-hidden">
            <div className="overflow-y-auto lg:overflow-x-hidden custom-scrollbar max-h-[70vh]">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="bg-white border-b h-14 w-full justify-start px-8 rounded-none gap-8">
                   <TabsTrigger value="basic" className="data-[state=active]:text-teal-600 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-teal-600 rounded-none h-full text-[10px] uppercase font-black tracking-widest gap-2"><User className="h-3.5 w-3.5" /> {t('identity')}</TabsTrigger>
                   <TabsTrigger value="financials" className="data-[state=active]:text-teal-600 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-teal-600 rounded-none h-full text-[10px] uppercase font-black tracking-widest gap-2"><DollarSign className="h-3.5 w-3.5" /> Financials</TabsTrigger>
                   <TabsTrigger value="technical" className="data-[state=active]:text-teal-600 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-teal-600 rounded-none h-full text-[10px] uppercase font-black tracking-widest gap-2"><Wrench className="h-3.5 w-3.5" /> Technical</TabsTrigger>
                </TabsList>

                <div className="p-8 md:p-10 space-y-8">
                   <TabsContent value="basic" className="mt-0 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2 lg:col-span-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('project')} Name *</Label>
                           <Input name="name" required defaultValue={selectedRecord?.name} className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-bold" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('customer')} *</Label>
                           <Select name="customerId" required defaultValue={selectedRecord?.customerId}>
                              <SelectTrigger className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-bold text-xs uppercase"><SelectValue placeholder="Select Client" /></SelectTrigger>
                              <SelectContent className="rounded-2xl">{customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('contactPerson')}</Label>
                           <Input name="contactPerson" defaultValue={selectedRecord?.contactPerson} className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('phone')}</Label>
                           <Input name="phone" defaultValue={selectedRecord?.phone} className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('address')}</Label>
                           <Input name="address" defaultValue={selectedRecord?.address} className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('projectType')}</Label>
                           <Select name="projectType" defaultValue={selectedRecord?.projectType || "CCTV"}>
                              <SelectTrigger className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="CCTV">CCTV Installation</SelectItem><SelectItem value="Networking">Networking & ISP</SelectItem><SelectItem value="Solar">Solar System</SelectItem><SelectItem value="Security">Security Access</SelectItem></SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('priorityLevel')}</Label>
                           <Select name="priority" defaultValue={selectedRecord?.priority || "Medium"}>
                              <SelectTrigger className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('status')}</Label>
                           <Select name="status" defaultValue={selectedRecord?.status || "pending"}>
                              <SelectTrigger className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="pending">Pending</SelectItem>
                                 <SelectItem value="active">In Progress</SelectItem>
                                 <SelectItem value="on-hold">On Hold</SelectItem>
                                 <SelectItem value="completed">Completed</SelectItem>
                                 <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                      </div>
                   </TabsContent>

                   <TabsContent value="financials" className="mt-0 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('estimatedBudget')} (৳)</Label>
                           <Input name="budget" type="number" required defaultValue={selectedRecord?.budget} className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-black text-lg text-blue-600" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('projectCost')} (৳)</Label>
                           <Input name="projectCost" type="number" defaultValue={selectedRecord?.projectCost} className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-black text-lg text-red-500" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('expectedProfit')} (৳)</Label>
                           <Input readOnly value={((Number(selectedRecord?.budget) || 0) - (Number(selectedRecord?.projectCost) || 0)).toLocaleString()} className="h-12 rounded-2xl border-none ring-1 ring-slate-100 bg-slate-50 font-black text-lg text-green-600" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('progress')} %</Label>
                           <Input name="progress" type="number" min="0" max="100" defaultValue={selectedRecord?.progress || 0} className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-black text-lg" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('startDate')}</Label>
                           <Input name="startDate" type="date" required defaultValue={selectedRecord?.startDate} className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('deadline')}</Label>
                           <Input name="deadline" type="date" required defaultValue={selectedRecord?.deadline} className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white" />
                        </div>
                      </div>
                   </TabsContent>

                   <TabsContent value="technical" className="mt-0 space-y-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('assignTeam')} (Engineers / Staff)</Label>
                           <Input name="engineers" defaultValue={selectedRecord?.engineers} placeholder="e.g. Engr. Tanvir, Engr. Ripon" className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Site Observations</Label>
                              <textarea name="description" defaultValue={selectedRecord?.description} className="min-h-[120px] w-full rounded-2xl border-none ring-1 ring-slate-200 bg-white p-4 text-xs font-medium" placeholder="Technical site details..." />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('notes')}</Label>
                              <textarea name="notes" defaultValue={selectedRecord?.notes} className="min-h-[120px] w-full rounded-2xl border-none ring-1 ring-slate-200 bg-white p-4 text-xs font-medium" placeholder="Internal project notes..." />
                           </div>
                        </div>
                      </div>
                   </TabsContent>
                </div>
              </Tabs>
            </div>

            <DialogFooter className="p-6 md:p-10 bg-white border-t flex-col sm:flex-row gap-4 shrink-0">
               <Button type="button" variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-[0.2em] px-10 h-12" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>{t('cancel')}</Button>
               <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 rounded-full px-16 h-14 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-teal-100 transition-all active:scale-95 flex-1 md:flex-none">
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('save')}
               </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">{t('projectArchived')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={() => { if(selectedRecord) deleteDocumentNonBlocking(doc(db!, "companies", companyId!, "branches", branchId!, "projects", selectedRecord.id)); setIsDeleteAlertOpen(false); toast({ title: t('success') }); }}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
