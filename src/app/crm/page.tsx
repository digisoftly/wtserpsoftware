
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { 
  Target, 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  Mail, 
  Phone, 
  Building2, 
  Filter, 
  Star, 
  TrendingUp,
  UserPlus,
  Trash2,
  Edit,
  Eye
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { KPICard } from "@/components/dashboard/kpi-card"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export default function CRMPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "leads"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: leads, isLoading } = useCollection(leadsQuery);

  const handleAddLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) {
      toast({ variant: "destructive", title: "Error", description: "Database context not initialized." });
      return;
    }

    const leadData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      status: "new",
      priority: formData.get("priority") as string,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "leads");
    addDocumentNonBlocking(colRef, leadData);
    setIsAddModalOpen(false);
    toast({ title: "Lead Captured", description: "Prospect added to sales pipeline." });
  };

  const handleUpdateLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || !selectedRecord) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const docRef = doc(db, "companies", companyId, "branches", branchId, "leads", selectedRecord.id);
      await updateDoc(docRef, {
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        company: formData.get("company"),
        priority: formData.get("priority"),
        status: formData.get("status"),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Lead Updated" });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = () => {
    if (!db || !companyId || !branchId || !selectedRecord) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "leads", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Lead Removed" });
    setIsDeleteAlertOpen(false);
  };

  const openEdit = (lead: any) => {
    setSelectedRecord(lead);
    setIsEditModalOpen(true);
  };

  const filteredLeads = leads?.filter(l => 
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-rose-600">Sales Pipeline (CRM)</h1>
          <p className="text-sm text-muted-foreground mt-1">Track leads, deals, and conversions</p>
        </div>
        <Button className="bg-rose-600 hover:bg-rose-700 gap-2 rounded-full px-8 shadow-lg h-11" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Capture Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Leads" value={leads?.length || 0} icon={Target} colorClass="bg-rose-500" />
        <KPICard title="Qualified" value={leads?.filter(l => l.status === 'qualified').length || 0} icon={Star} colorClass="bg-amber-500" />
        <KPICard title="New Today" value={leads?.filter(l => l.status === 'new').length || 0} icon={Plus} colorClass="bg-blue-500" />
        <KPICard title="Avg Conversion" value="18%" icon={TrendingUp} colorClass="bg-green-500" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads or organizations..." className="pl-9 h-10 border-none ring-1 ring-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto h-10 rounded-full"><Filter className="h-4 w-4" /> Filters</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rose-600" /></div>
      ) : leads && leads.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads?.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-xs md:text-sm">{lead.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Building2 className="h-3 w-3 text-muted-foreground" /> {lead.company || "Personal"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[10px] text-muted-foreground leading-tight">
                        <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {lead.email}</span>
                        <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {lead.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize text-[9px] px-2", 
                        lead.status === 'new' ? "bg-blue-50 text-blue-700 border-blue-200" : 
                        lead.status === 'qualified' ? "bg-green-50 text-green-700 border-green-200" :
                        "bg-gray-50 text-gray-700 border-gray-200")}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(lead)}><Edit className="mr-2 h-4 w-4" /> Edit Lead</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({ title: "Opening Lead Profile" })}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-green-600" onClick={() => toast({ title: "Converting to Customer" })}>
                            <UserPlus className="mr-2 h-4 w-4" /> Convert to Client
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedRecord(lead); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Remove Lead
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
      ) : (
        <div className="p-16 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <Target className="h-12 w-12 text-rose-300 mb-4 opacity-50" />
          <h2 className="text-xl font-headline font-bold">Pipeline is Empty</h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">Start your sales cycle by adding potential clients and tracking their journey.</p>
          <Button className="mt-6 bg-rose-600 rounded-full px-8 h-11" onClick={() => setIsAddModalOpen(true)}>Initialize Lead</Button>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedRecord(null); } }}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl flex items-center gap-2">
              <Target className="h-5 w-5 text-rose-600" />
              {isEditModalOpen ? "Adjust Prospect Data" : "New Lead Acquisition"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={isEditModalOpen ? handleUpdateLead : handleAddLead} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Full Name</Label>
              <Input name="name" required defaultValue={selectedRecord?.name} placeholder="Prospect Name" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Company (Optional)</Label>
              <Input name="company" defaultValue={selectedRecord?.company} placeholder="Business Organization" className="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Email</Label><Input name="email" type="email" defaultValue={selectedRecord?.email} className="h-11 rounded-xl" /></div>
              <div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Phone</Label><Input name="phone" defaultValue={selectedRecord?.phone} className="h-11 rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Priority</Label>
                <Select name="priority" defaultValue={selectedRecord?.priority || "medium"}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isEditModalOpen && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Status</Label>
                  <Select name="status" defaultValue={selectedRecord?.status}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 rounded-full w-full h-12 font-bold shadow-lg shadow-rose-100">
                {isSubmitting ? <Loader2 className="animate-spin" /> : isEditModalOpen ? "Save Adjustments" : "Record to Pipeline"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Lead Record?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {selectedRecord?.name}? This prospect will be removed from your active sales pipeline.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteLead}>Confirm Removal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
