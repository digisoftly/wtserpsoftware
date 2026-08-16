
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ShieldCheck, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Settings2,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Trash2,
  FileDown,
  Printer,
  ChevronRight
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { AuditService } from "@/lib/audit-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ERP_MODULES = [
  "dashboard", "sales", "payments", "quotations", "dispatch", "purchases", "returns",
  "inventory", "serialTracking", "project-billing", "contracts", "customers", 
  "suppliers", "accounts", "expenses", "masterManagement", "support", "crm", 
  "hrm", "branches", "reports", "ai", "settings", "users", "audit"
];

const ACTIONS = ["view", "create", "edit", "delete", "approve", "export", "print"];

export default function RoleMatrixPage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, userRole: currentRole } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [roleName, setRoleName] = React.useState("");
  const [permissions, setPermissions] = React.useState<Record<string, string[]>>({});
  const [dataScopes, setDataScopes] = React.useState<Record<string, string>>({});

  const roleRef = useMemoFirebase(() => {
    if (!db || !companyId || !id) return null;
    return doc(db, "companies", companyId, "roles", id as string);
  }, [db, companyId, id]);

  const { data: role, isLoading } = useDoc(roleRef);

  React.useEffect(() => {
    if (role) {
      setRoleName(role.name);
      setPermissions(role.permissions || {});
      setDataScopes(role.dataScopes || {});
    }
  }, [role]);

  const togglePermission = (module: string, action: string) => {
    setPermissions(prev => {
      const current = prev[module] || [];
      const updated = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action];
      return { ...prev, [module]: updated };
    });
  };

  const handleSave = async () => {
    if (!roleRef || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateDoc(roleRef, {
        name: roleName,
        permissions,
        dataScopes,
        updatedAt: serverTimestamp()
      });

      if (db && companyId && currentRole) {
        await AuditService.logAction(db, companyId, {
          userId: currentRole.id,
          userName: currentRole.name,
          action: 'UPDATE',
          module: 'roles',
          recordId: id as string,
          details: `Updated role permissions for ${roleName}`
        });
      }

      toast({ title: t('success') });
      router.push("/users");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-violet-600" /></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-violet-600">{roleName}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Authority Configuration Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-100 gap-2" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Synchronize Matrix
          </Button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full p-4 md:p-8 space-y-8">
        <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
          <div className="max-w-md space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Role Name</Label>
            <Input value={roleName} onChange={e => setRoleName(e.target.value)} className="h-12 rounded-xl font-black uppercase" />
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="h-14 text-[10px] uppercase font-black pl-8 w-[250px]">ERP Module</TableHead>
                <TableHead className="h-14 text-[10px] uppercase font-black text-center">Data Scope</TableHead>
                {ACTIONS.map(action => (
                  <TableHead key={action} className="h-14 text-[10px] uppercase font-black text-center">{action}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ERP_MODULES.map(module => (
                <TableRow key={module} className="h-16 hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-3">
                      <ChevronRight className="h-3 w-3 text-slate-300" />
                      <span className="font-black text-[11px] uppercase tracking-tighter text-slate-900">{t(module as any)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Select 
                        value={dataScopes[module] || "own"} 
                        onValueChange={(val) => setDataScopes(prev => ({ ...prev, [module]: val }))}
                      >
                        <SelectTrigger className="h-8 w-32 rounded-lg border-none bg-slate-100 font-bold text-[9px] uppercase">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-2xl">
                          <SelectItem value="own" className="text-xs font-bold">Own Records</SelectItem>
                          <SelectItem value="branch" className="text-xs font-bold">Branch Wide</SelectItem>
                          <SelectItem value="all" className="text-xs font-bold">Org Wide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  {ACTIONS.map(action => (
                    <TableCell key={`${module}-${action}`} className="text-center">
                      <Checkbox 
                        checked={permissions[module]?.includes(action)}
                        onCheckedChange={() => togglePermission(module, action)}
                        className="data-[state=checked]:bg-violet-600 border-slate-200"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
