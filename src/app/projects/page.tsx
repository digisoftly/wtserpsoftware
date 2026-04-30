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
  Target
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
    pending: projects?.filter(p => p.status === 'pending').length || 0
  }), [projects]);

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    setIsSubmitting(true);
    try {
      const projectRef = doc(collection(db, "companies", companyId, "branches", branchId, "projects"));
      await setDoc(projectRef, {
        id: projectRef.id,
        companyId,
        branchId,
        name: formData.get("name") as string,
        customerId: formData.get("customerId") as string,
        budget: Number(formData.get("budget")),
        startDate: formData.get("startDate") as string,
        deadline: formData.get("deadline") as string,
        status: "pending",
        progress: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: t('success') });
      setIsAddModalOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRecord || !db || !companyId || !branchId) return;
    
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const docRef = doc(db, "companies", companyId, "branches", branchId, "projects", selectedRecord.id);
      await updateDoc(docRef, {
        name: formData.get("name"),
        customerId: formData.get("customerId"),
        budget: Number(formData.get("budget")),
        startDate: formData.get("startDate"),
        deadline: formData.get("deadline"),
        status: formData.get("status"),
        progress: Number(formData.get("progress")),
        updatedAt: serverTimestamp()
      });
      toast({ title: t('success') });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "projects", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
  };

  const openEdit = (p: any) => {
    setSelectedRecord(p);
    setIsEditModalOpen(true);
  };

  const filteredProjects = projects?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customers?.find(c => c.id === p.customerId)?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-teal-600 uppercase tracking-tight">{t('projects')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-full px-8 shadow-xl shadow-teal-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('addProject')}
        </Button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('projects')} value={stats.total} icon={Folder} colorClass="bg-blue-600" />
        <KPICard title={t('running')} value={stats.running} icon={TrendingUp} colorClass="bg-teal-600" />
        <KPICard title={t('completed')} value={stats.completed} icon={ClipboardCheck} colorClass="bg-green-600" />
        <KPICard title={t('pending_status')} value={stats.pending} icon={Clock} colorClass="bg-orange-600" />
      </div>

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-2xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder={t('search')} 
            className="h-10 pl-10 border-none bg-slate-50/50 rounded-xl text-xs font-bold" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-6">{t('project')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('budget')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('status')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('progress')}</TableHead>
                  <TableHead className="h-12 text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects?.map((p) => (
                  <TableRow key={p.id} className="h-20 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase text-slate-900 truncate max-w-[250px]">{p.name}</span>
                        <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-muted-foreground uppercase">
                          <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {p.startDate ? new Date(p.startDate).toLocaleDateString() : '---'}</span>
                          <ChevronRight className="h-2 w-2" />
                          <span className="flex items-center gap-1 text-red-400"><Target className="h-2.5 w-2.5" /> {p.deadline ? new Date(p.deadline).toLocaleDateString() : '---'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-slate-700">
                        {customers?.find(c => c.id === p.customerId)?.firstName || t('customer')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-xs text-slate-900">৳{p.budget?.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[8px] h-5 uppercase border-none px-2 font-black",
                        p.status === 'completed' ? "bg-green-50 text-green-700" : 
                        p.status === 'active' ? "bg-teal-50 text-teal-700" : 
                        "bg-orange-50 text-orange-700"
                      )}>
                        {t(`${p.status}_status` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[150px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase">
                          <span className="text-muted-foreground">{p.progress || 0}%</span>
                        </div>
                        <Progress value={p.progress || 0} className="h-1.5 bg-slate-100" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-teal-50 text-teal-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                          <DropdownMenuItem className="text-xs font-bold"><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => openEdit(p)}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(p); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ADD/EDIT DIALOG */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedRecord(null); } }}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50">
          <DialogHeader className="bg-teal-600 p-6 text-white flex-row items-center gap-4 space-y-0">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Folder className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">{isEditModalOpen ? t('edit') : t('addProject')}</DialogTitle>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">{t('initialize')}</p>
            </div>
          </DialogHeader>
          
          <form onSubmit={isEditModalOpen ? handleUpdateProject : handleAddProject} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('itemDescription')}</Label>
                  <Input name="name" required defaultValue={selectedRecord?.name} className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white" placeholder="e.g. CCTV System - WTC Plaza" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('customer')}</Label>
                  <Select name="customerId" required defaultValue={selectedRecord?.customerId}>
                    <SelectTrigger className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white shadow-sm">
                      <SelectValue placeholder={t('search')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('budget')} (৳)</Label>
                  <Input name="budget" type="number" required defaultValue={selectedRecord?.budget} className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white font-black" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('startDate')}</Label>
                    <Input name="startDate" type="date" required defaultValue={selectedRecord?.startDate} className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white text-[11px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('deadline')}</Label>
                    <Input name="deadline" type="date" required defaultValue={selectedRecord?.deadline} className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white text-[11px]" />
                  </div>
                </div>

                {isEditModalOpen && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('status')}</Label>
                      <Select name="status" defaultValue={selectedRecord?.status}>
                        <SelectTrigger className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="pending" className="text-xs font-bold">{t('pending_status')}</SelectItem>
                          <SelectItem value="active" className="text-xs font-bold">{t('active_status')}</SelectItem>
                          <SelectItem value="completed" className="text-xs font-bold">{t('completed_status')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('progress')} (%)</Label>
                      <Input name="progress" type="number" min="0" max="100" defaultValue={selectedRecord?.progress || 0} className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white font-black" />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-8" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 rounded-full px-12 h-12 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-100 flex-1">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">{t('projectArchived')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={handleDeleteProject}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
