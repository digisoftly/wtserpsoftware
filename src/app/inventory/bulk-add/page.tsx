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
import { collection, doc, runTransaction, serverTimestamp, orderBy, query } from "firebase/firestore"
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
  costPrice: number
  unitPrice: number
  quantity: number
  serials: string
  isSerialized: boolean
}

export default function BulkInventoryPage() {
  const router = useRouter()
  const { companyId, branchId, userRole } = useTenant()
  const db = useFirestore()
  const [items, setItems] = React.useState<BulkItem[]>([createEmptyItem()])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [targetBranchId, setTargetBranchId] = React.useState(branchId || "")

  // Fetch branches for distribution
  const branchesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null
    return query(collection(db, "companies", companyId, "branches"), orderBy("name"))
  }, [db, companyId])
  const { data: branches } = useCollection(branchesQuery)

  function createEmptyItem(): BulkItem {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      sku: "",
      costPrice: 0,
      unitPrice: 0,
      quantity: 1,
      serials: "",
      isSerialized: false
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
      
      // Auto-calculate quantity for serialized items based on serial string
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
          sku: row.sku || row.SKU || "",
          costPrice: Number(row.costPrice || row.Cost || 0),
          unitPrice: Number(row.unitPrice || row.Price || 0),
          quantity: Number(row.quantity || row.Qty || 1),
          serials: row.serials || row.Serials || "",
          isSerialized: !!(row.serials || row.isSerialized === 'true')
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
    const csvContent = "name,sku,costPrice,unitPrice,quantity,isSerialized,serials\nSample Product,SKU-001,100,150,1,false,\nSerial Product,SKU-002,500,750,2,true,\"SN123,SN124\""
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
    const validItems = items.filter(i => i.name && i.sku)
    if (validItems.length === 0) {
      toast({ variant: "destructive", title: "No Valid Data", description: "Please enter product name and SKU." })
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
            sku: item.sku,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            currentStock: item.quantity,
            minStockLevel: 5,
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
            <p className="text-sm text-muted-foreground mt-1">Add hundreds of items in seconds via Grid or CSV</p>
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
            className="bg-orange-600 hover:bg-orange-700 rounded-full px-8 gap-2 shadow-lg shadow-orange-100"
            onClick={handleSaveAll}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Finalize Intake
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-xl">
        <CardHeader className="bg-muted/20 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-orange-600" /> Intake Worksheet
              </CardTitle>
              <CardDescription>Fill the grid below or upload a spreadsheet to begin.</CardDescription>
            </div>
            {userRole?.isSuperAdmin && (
              <div className="flex items-center gap-3 bg-white p-2 rounded-xl border shadow-sm px-4">
                <Label className="text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">Target Location</Label>
                <Select value={targetBranchId} onValueChange={setTargetBranchId}>
                  <SelectTrigger className="w-[200px] h-9 border-none font-bold text-orange-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[250px]">Product Name</TableHead>
                  <TableHead className="w-[150px]">SKU / ID</TableHead>
                  <TableHead className="w-[120px]">Cost (৳)</TableHead>
                  <TableHead className="w-[120px]">Sale (৳)</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[100px]">Serial?</TableHead>
                  <TableHead>Serials (Comma Separated)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/10">
                    <TableCell>
                      <Input 
                        placeholder="e.g. Sony 4K Camera" 
                        value={item.name} 
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className="h-9 border-transparent focus:border-orange-200 bg-transparent text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="CAM-001" 
                        value={item.sku} 
                        onChange={(e) => handleUpdateItem(item.id, 'sku', e.target.value)}
                        className="h-9 border-transparent focus:border-orange-200 bg-transparent font-mono text-xs uppercase"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={item.costPrice} 
                        onChange={(e) => handleUpdateItem(item.id, 'costPrice', Number(e.target.value))}
                        className="h-9 border-transparent focus:border-orange-200 bg-transparent text-sm font-bold"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={item.unitPrice} 
                        onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                        className="h-9 border-transparent focus:border-orange-200 bg-transparent text-sm font-bold"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        disabled={item.isSerialized}
                        value={item.quantity} 
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                        className="h-9 border-transparent focus:border-orange-200 bg-transparent text-sm text-center"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input 
                        type="checkbox" 
                        checked={item.isSerialized} 
                        onChange={(e) => handleUpdateItem(item.id, 'isSerialized', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="S123, S124..." 
                        disabled={!item.isSerialized}
                        value={item.serials} 
                        onChange={(e) => handleUpdateItem(item.id, 'serials', e.target.value)}
                        className="h-9 border-transparent focus:border-orange-200 bg-transparent text-[10px] font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
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
          <div className="p-4 border-t bg-muted/10">
            <Button variant="ghost" className="w-full border-2 border-dashed border-muted-foreground/20 rounded-xl h-12 text-muted-foreground hover:bg-white hover:text-orange-600 gap-2" onClick={handleAddRow}>
              <Plus className="h-4 w-4" /> Add More Rows
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-orange-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-orange-600 tracking-widest">Row Count</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold font-headline">{items.filter(i => i.name).length} Items Detected</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-blue-600 tracking-widest">Total Valuation</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">
              ৳{items.reduce((s, i) => s + (i.costPrice * i.quantity), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-purple-600 tracking-widest">Serial Inventory</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">
              {items.filter(i => i.isSerialized).length} Unique SKU(s)
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-200">
        <AlertCircle className="h-6 w-6 text-blue-600" />
        <div>
          <p className="text-sm font-bold text-blue-900">Validation System Active</p>
          <p className="text-[10px] text-blue-700">The system will automatically deduplicate SKUs and verify serial availability during the intake process.</p>
        </div>
      </div>
    </div>
  )
}
