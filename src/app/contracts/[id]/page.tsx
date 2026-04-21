"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  CreditCard,
  History,
  MoreVertical,
  Printer
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"

export default function ContractDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { companyId, branchId } = useTenant()
  const db = useFirestore()
  const { t } = useTranslation()

  const contractRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null
    return doc(db, "companies", companyId, "branches", branchId, "service_contracts", id as string)
  }, [db, companyId, branchId, id])

  const { data: contract, isLoading } = useDoc(contractRef)

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null
    return query(
      collection(db, "companies", companyId, "branches", branchId, "contract_invoices"),
      where("contractId", "==", id),
      orderBy("billingMonth", "desc")
    )
  }, [db, companyId, branchId, id])

  const { data: invoices } = useCollection(invoicesQuery)

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
  }

  if (!contract) {
    return (
      <div className="p-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <p className="text-sm font-bold uppercase text-muted-foreground">{t('error')}</p>
        <Button variant="link" onClick={() => router.back()}>{t('back')}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-headline text-emerald-600 uppercase tracking-tighter">
                {contract.contractNumber}
              </h1>
              <Badge className={cn(
                "text-[9px] h-5 uppercase px-2 font-black border-none",
                contract.status === 'active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}>
                {t(`${contract.status}_status` as any)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{contract.serviceName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full gap-2 text-[10px] uppercase font-bold h-9">
            <Printer className="h-3.5 w-3.5" /> {t('print')}
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full h-9 px-6 text-[10px] uppercase font-bold shadow-lg">
            {t('edit')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title={t('fee')} 
          value={`৳${Number(contract.monthlyAmount || 0).toLocaleString()}`} 
          icon={DollarSign} 
          colorClass="bg-emerald-600" 
        />
        <KPICard 
          title={t('billingCycle')} 
          value={contract.billingCycle || "Monthly"} 
          icon={Clock} 
          colorClass="bg-blue-600" 
        />
        <KPICard 
          title={t('startDate')} 
          value={new Date(contract.startDate).toLocaleDateString()} 
          icon={Calendar} 
          colorClass="bg-purple-600" 
        />
        <KPICard 
          title={t('dueAmount')} 
          value={`৳${(invoices?.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount || 0), 0) || 0).toLocaleString()}`} 
          icon={AlertCircle} 
          colorClass="bg-orange-600" 
        />
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-10 ring-1 ring-slate-100">
          <TabsTrigger value="info" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-bold h-8">
            <FileText className="h-3.5 w-3.5" /> {t('details')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-bold h-8">
            <CreditCard className="h-3.5 w-3.5" /> {t('billingHistory')}
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-bold h-8">
            <History className="h-3.5 w-3.5" /> {t('timeline')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('contractTerm')}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-400">{t('service')}</p>
                    <p className="text-sm font-bold">{contract.serviceName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-400">{t('type')}</p>
                    <p className="text-sm font-bold uppercase">{contract.serviceType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-400">{t('startDate')}</p>
                    <p className="text-sm font-bold">{new Date(contract.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-400">{t('endDate')}</p>
                    <p className="text-sm font-bold">{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "Permanent"}</p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-dashed">
                   <p className="text-[9px] uppercase font-black text-slate-400 mb-2">{t('details')}</p>
                   <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-xl">
                     {contract.description || "Standard service level agreement for periodic maintenance and technical support."}
                   </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100 h-fit">
              <CardHeader className="bg-emerald-600 py-4 px-6 text-white">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('customer')}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mx-auto mb-4 border-2 border-emerald-100">
                  {contract.customerName?.[0] || "C"}
                </div>
                <h3 className="font-bold text-sm text-slate-900">{contract.customerName || "Organization Client"}</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-black mt-1">ID: #{contract.customerId?.slice(0, 8)}</p>
                <Button variant="outline" className="w-full mt-6 rounded-full text-[10px] font-bold uppercase h-8 border-emerald-100 text-emerald-600 hover:bg-emerald-50" onClick={() => router.push('/customers')}>
                  {t('profile')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          {invoices && invoices.length > 0 ? (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold h-9">{t('date')}</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold h-9">{t('amount')}</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold h-9">{t('status')}</TableHead>
                    <TableHead className="text-right h-9"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="h-12 hover:bg-muted/10 transition-colors">
                      <TableCell className="text-[10px] font-bold uppercase">{inv.billingMonth}</TableCell>
                      <TableCell className="font-black text-xs">৳{inv.amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[8px] h-5 uppercase border-none px-2 font-black",
                          inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                        )}>
                          {t(`${inv.status}_status` as any)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="p-16 bg-white rounded-[2rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <History className="h-10 w-10 text-slate-200 mb-4" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('noSales')}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
             <CardContent className="p-12 text-center text-muted-foreground italic text-[10px] uppercase font-black tracking-[0.2em]">
               {t('loading')}
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
