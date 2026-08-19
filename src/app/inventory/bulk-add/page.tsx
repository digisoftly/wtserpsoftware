
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  Table as TableIcon,
  Boxes,
  FileSpreadsheet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, runTransaction, serverTimestamp, orderBy, query, where } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Papa from "papaparse"

interface BulkItem {
  id: string
  name: string
  sku: string
  unit: string
  costPrice: number
  unitPrice: number
  quantity: number
  serials: string
  isSerialized: boolean
  warranty: string
  location: string
}

export default function BulkInventoryPage() {
  const router = useRouter()
  const { companyId, branchId, userRole } = useTenant()
  const db = useFirestore()
  const [items, setItems] = React.useState<BulkItem[]>([createEmptyItem()])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [targetBranchId, setTargetBranchId] = React.useState(branchId || "")

  // Fetch Master Data
  const branchesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null
    return query(collection(db, "companies", companyId, "branches"), orderBy("branchName"))
  }, [db, companyId])
  const { data: branches } = useCollection(branchesQuery)

  const warrantyQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_data"), where("type", "==", "warrantyTypes"));
  }, [db, companyId]);
  const { data: warrantyTypes } = useCollection(warrantyQuery);

  const uniqueWarrantyTypes = React.useMemo(() => {
    if (!warrantyTypes) return [];
    const seen = new Set();
    return warrantyTypes.filter(w => {
      if (seen.has(w.name)) return false;
      seen.add(w.name);
      return true;
    });
  }, [warrantyTypes]);

  function createEmptyItem(): BulkItem {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      sku: "",
      unit: "Pcs",
      costPrice: 0,
      unitPrice: 0,
      quantity: 1,
      serials: "",
      isSerialized: false,
      warranty: "1 Year",
      location: ""
    }
  }

  const handleAddRow = () => setItems([...items, createEmptyItem()])
  
  const handleRemoveRow = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id))
    }
  }

  const handleUpdateItem = (id: string, field: keyof BulkItem, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      
      if (field === 'serials' || field === 'isSerialized') {
        const serialList = updated.serials.split(',').map(s => s.trim()).filter(s => s !== "")
        if (updated.isSerialized && serialList.length > 0) {
          updated.quantity = serialList.length
        }
      }
      return updated
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const importedItems: BulkItem[] = results.data.map((row: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: row.name || row.Name || "",
          sku: row.model || row.sku || row.Model || row.SKU || "",
          unit: row.unit || row.Unit || "Pcs",
          costPrice: Number(row.costPrice || row.Cost || 0),
          unitPrice: Number(row.unitPrice || row.Price || 0),
          quantity: Number(row.quantity || row.Qty || 1),
          serials: row.serials || row.Serials || "",
          isSerialized: !!(row.serials || row.isSerialized === 'true'),
          warranty: row.warranty || row.Warranty || "1 Year",
          location: row.location || row.Location || ""
        }))
        setItems([...items.filter(i => i.name !== ""), ...importedItems])
        toast({ title: "Import Successful", description: `${importedItems.length} rows detected.` })
      },
      error: (error) => {
        toast({ variant: "destructive", title: "Import Failed", description: error.message })
      }
    })
  }

  const downloadTemplate = () => {
    const csvContent = "name,model,unit,costPrice,unitPrice,quantity,isSerialized,serials,warranty,location\nSample Product,MOD-001,Pcs,100,150,1,false,,1 Year,Shelf A1\nSerial Product,MOD-002,Box,500,750,2,true,\"SN123,SN124\",2 Years,Rack 5"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "bulk_inventory_template.csv")
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSaveAll = async () => {
    const validItems = items.filter(i => i.name.trim() !== "")
    if (validItems.length === 0) {
      toast({ variant: "destructive", title: "No Valid Data", description: "Please enter at least one product name." })
      return
    }

    if (!companyId || !targetBranchId) {
      toast({ variant: "destructive", title: "Target Missing", description: "Please select a target branch." })
      return
    }

    setIsSubmitting(true)
    try {
      await runTransaction(db, async (transaction) => {
        const poRef = doc(collection(db, "companies", companyId, "branches", targetBranchId, "purchase_orders"))
        const intakeSummary = {
          id: poRef.id,
          companyId,
          branchId: targetBranchId,
          orderNumber: `BULK-${Date.now().toString().slice(-6)}`,
          status: "received",
          type: "bulk_intake",
          totalItems: validItems.length,
          orderDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
        }

        transaction.set(poRef, intakeSummary)

        for (const item of validItems) {
          const productRef = doc(collection(db, "companies", companyId, "branches", targetBranchId, "products"))
          const productData = {
            id: productRef.id,
            companyId,
            branchId: targetBranchId,
            name: item.name,
            sku: item.sku || "",
            unit: item.unit || "Pcs",
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            currentStock: item.quantity,
            minStockLevel: 5,
            warranty: item.warranty,
            location: item.location,
            serialNumberTrackingRequired: item.isSerialized,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
          
          transaction.set(productRef, productData)

          if (item.isSerialized && item.serials) {
            const serialList = item.serials.split(',').map(s => s.trim()).filter(s => s !== "")
            for (const sn of serialList) {
              const serialRef = doc(collection(db, "companies", companyId, "branches", targetBranchId, "serial_numbers"))
              transaction.set(serialRef, {
                id: serialRef.id,
                companyId,
                branchId: targetBranchId,
                productId: productRef.id,
                serialNumber: sn,
                status: "available",
                warranty: item.warranty,
                location: item.location,
                purchaseOrderId: poRef.id,
                createdAt: serverTimestamp()
              })
            }
          }
        }
      })

      toast({ title: "Inventory Synchronized", description: `${validItems.length} products added successfully.` })
      router.push("/inventory")
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-orange-600 flex items-center gap-2">
              <Boxes className="h-8 w-8" /> Bulk Inventory Intake
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Add hundreds of items with Warranty and Location tracking</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-full gap-2" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Template
          </Button>
          <div className="relative">
            <Button variant="outline" className="rounded-full gap-2">
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
          </div>
          <Button 
            className="bg-orange-600 hover:bg-orange-700 rounded-full px-8 gap-2 shadow-lg shadow-orange-100 transition-all active:scale-95"
            onClick={handleSaveAll}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Finalize Intake
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-xl bg-white ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-orange-600" /> Intake Worksheet
              </CardTitle>
            </div>
            {userRole?.isSuperAdmin && (
              <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border px-4 shadow-sm">
                <Label className="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Target Location</Label>
                <Select value={targetBranchId} onValueChange={setTargetBranchId}>
                  <SelectTrigger className="w-[200px] h-8 border-none font-bold text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-2xl">
                    {branches?.map((b, idx) => (
                      <SelectItem key={`branch-bulk-${b.id}-${idx}`} value={b.id}>{b.branchName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow>
                  <TableHead className="w-[250px] text-[10px] font-black uppercase tracking-widest">Product Name</TableHead>
                  <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-widest">Model/SKU</TableHead>
                  <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-widest">Warranty</TableHead>
                  <TableHead className="w-[150px] text-[10px] font-black uppercase tracking-widest">Storage Loc</TableHead>
                  <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest text-center">Qty</TableHead>
                  <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-right">Cost (৳)</TableHead>
                  <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-right pr-6">Sale (৳)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50 transition-colors h-14 border-slate-50">
                    <TableCell>
                      <Input 
                        placeholder="e.g. SONY 4K IP Camera" 
                        value={item.name} 
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className="h-9 border-none bg-slate-100/50 rounded-lg text-xs font-bold uppercase"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Model" 
                        value={item.sku} 
                        onChange={(e) => handleUpdateItem(item.id, 'sku', e.target.value)}
                        className="h-9 border-none bg-slate-100/50 rounded-lg font-mono text-[10px] uppercase"
                      />
                    </TableCell>
                    <TableCell>
                       <Select value={item.warranty} onValueChange={(val) => handleUpdateItem(item.id, 'warranty', val)}>
                         <SelectTrigger className="h-9 border-none bg-slate-100/50 rounded-lg text-[10px] font-bold uppercase">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl shadow-2xl">
                           {uniqueWarrantyTypes?.map((w, idx) => (
                             <SelectItem key={`bulk-warranty-${w.id || idx}`} value={w.name}>{w.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Shelf A1" 
                        value={item.location} 
                        onChange={(e) => handleUpdateItem(item.id, 'location', e.target.value)}
                        className="h-9 border-none bg-slate-100/50 rounded-lg text-[10px] uppercase font-bold"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        disabled={item.isSerialized}
                        value={item.quantity} 
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                        className="h-9 border-none bg-slate-100/50 rounded-lg text-xs text-center font-black"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={item.costPrice} 
                        onChange={(e) => handleUpdateItem(item.id, 'costPrice', Number(e.target.value))}
                        className="h-9 border-none bg-slate-100/50 rounded-lg text-xs text-right font-black"
                      />
                    </TableCell>
                    <TableCell className="pr-6">
                      <Input 
                        type="number" 
                        value={item.unitPrice} 
                        onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                        className="h-9 border-none bg-blue-50 rounded-lg text-xs text-right font-black text-blue-700"
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-300 hover:text-red-600 rounded-full"
                        onClick={() => handleRemoveRow(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t bg-slate-50/50 flex justify-center">
            <Button variant="ghost" className="w-full max-w-sm border-2 border-dashed border-slate-200 rounded-2xl h-14 text-slate-400 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all font-black text-[10px] uppercase tracking-widest gap-2" onClick={handleAddRow}>
              <Plus className="h-4 w-4" /> Add Next Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
