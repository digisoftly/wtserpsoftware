"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Building2, Plus, MapPin, Phone, User, Search, Loader2, MoreVertical, Edit, Trash2, ShieldCheck, CheckCircle2 } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, setDoc, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function BranchesPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const branchesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "branches"), orderBy("name"));
  }, [db, companyId]);

  const { data: branches, isLoading } = useCollection(branchesQuery);

  const stats = React.useMemo(() => ({
    total: branches?.length || 0,
    active: branches?.filter(b => b.isActive).length || 0
  }), [branches]);

  const handleDeleteBranch = () => {
    if (!selectedRecord || !db || !companyId) return;
    const docRef = doc(db, "companies", companyId, "branches", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Branch Removed" });
    setIsDeleteAlertOpen(false);
  };

  const filteredBranches = branches?.filter(b => 
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-blue-600">Branches</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2 rounded-full h-9 px-6 text-[10px] uppercase font-bold shadow-lg shadow-blue-100" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title="Total Branches" value={stats.total} icon={Building2} colorClass="bg-blue-600" subtext="Organization hubs" />
        <KPICard title="Active Branches" value={stats.active} icon={CheckCircle2} colorClass="bg-green-600" subtext="In operation" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search location..." className="pl-9 h-9 border-none bg-white shadow-sm ring-1 ring-slate-100 text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="text-[10px] uppercase font-bold h-9">Branch</TableHead>
                <TableHead className="text-[10px] uppercase font-bold h-9">Code</TableHead>
                <TableHead className="text-right h-9"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches?.map((b) => (
                <TableRow key={b.id} className="h-12 hover:bg-muted/10 transition-colors">
                  <TableCell>
                    <div className="font-bold text-xs">{b.name}</div>
                    <div className="text-[9px] uppercase font-black text-muted-foreground">{b.city || "Organization"}</div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] font-black text-blue-600">{b.code}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-xs" onClick={() => { setSelectedRecord(b); setIsEditModalOpen(true); }}><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 text-xs" onClick={() => { setSelectedRecord(b); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ADD/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedRecord(null); } }}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-blue-600 p-6 text-white flex-row items-center gap-3">
            <Building2 className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">{isEditModalOpen ? "Edit Branch" : "New Location"}</DialogTitle>
          </DialogHeader>
          <div className="p-6 bg-slate-50 italic text-[10px] uppercase font-bold tracking-widest text-center py-20 text-muted-foreground">
            Location Setup Wizard
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
