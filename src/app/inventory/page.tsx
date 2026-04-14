
"use client"

import * as React from "react"
import { 
  Search, 
  Plus, 
  Filter, 
  BarChart, 
  Zap, 
  RefreshCw,
  Loader2,
  Package,
  MoreVertical,
  Boxes,
  AlertTriangle,
  Activity,
  DollarSign,
  Scan
} from "lucide-react"
import { inventoryForecasting, type InventoryForecastingOutput } from "@/ai/flows/ai-inventory-forecasting-and-optimization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, doc, setDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function InventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isForecasting, setIsForecasting] = React.useState(false)
  const [forecast, setForecast] = React.useState<InventoryForecastingOutput | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serialRequired, setSerialRequired] = React.useState(false);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);

  const { data: products, isLoading } = useCollection(productsQuery);

  const totalItems = products?.length || 0;
  const totalStockValue = products?.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.costPrice || 0)), 0) || 0;
  const lowStockCount = products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 0)).length || 0;

  const handleRunForecast = async () => {
    if (!products || products.length === 0) {
      toast({ variant: "destructive", title: "Missing Data", description: "Add products before running AI forecasting." });
      return;
    }
    setIsForecasting(true);
    try {
      const result = await inventoryForecasting({
        historicalSalesData: [{ date: new Date().toISOString(), productId: products[0].id, quantitySold: 45 }],
        currentInventory: products.map(p => ({
          productId: p.id,
          currentStock: p.currentStock || 0,
          reorderPoint: p.minStockLevel || 0,
          maxStockLevel: (p.minStockLevel || 0) * 3
        })),
        productCatalog: products.map(p => ({
          productId: p.id,
          productName: p.name,
          unitCost: p.costPrice || 0,
          unitPrice: p.unitPrice || 0
        }))
      });
      setForecast(result);
      toast({ title: "Intelligence Generated", description: "Optimization strategies updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Flow Error", description: "AI service unreachable." });
    } finally {
      setIsForecasting(false);
    }
  }

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    setIsSubmitting(true);
    try {
      const productRef = doc(collection(db, "companies", companyId, "branches", branchId, "products"));
      const productData = {
        id: productRef.id,
        companyId,
        branchId,
        name: formData.get("name") as string,
        sku: formData.get("sku") as string,
        unitPrice: Number(formData.get("unitPrice")),
        costPrice: Number(formData.get("costPrice")),
        currentStock: Number(formData.get("currentStock")),
        minStockLevel: Number(formData.get("minStockLevel")),
        serialNumberTrackingRequired: serialRequired,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(productRef, productData);
      toast({ title: "Product Created", description: serialRequired ? "Serialized product added." : "Standard product added." });
      setIsAddModalOpen(false);
      setSerialRequired(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">Warehouse Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Stock control & serial tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRunForecast} disabled={isForecasting} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full gap-2 font-semibold shadow-lg">
            {isForecasting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} AI Intelligence
          </Button>
          <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2 px-6" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Assets" value={totalItems} icon={Boxes} colorClass="bg-blue-500" />
        <KPICard title="Valuation" value={`৳${totalStockValue.toLocaleString()}`} icon={DollarSign} colorClass="bg-green-500" />
        <KPICard title="Low Stock" value={lowStockCount} icon={AlertTriangle} colorClass="bg-red-500" />
        <KPICard title="Serialized" value={products?.filter(p => p.serialNumberTrackingRequired).length || 0} icon={Scan} colorClass="bg-purple-500" />
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="bg-white p-1 rounded-xl shadow-sm border mb-6 flex h-auto">
          <TabsTrigger value="list" className="rounded-lg flex-1">Catalog</TabsTrigger>
          <TabsTrigger value="ai-insights" className="rounded-lg flex-1">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search SKU, Name..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button variant="outline" className="gap-2 rounded-lg w-full sm:w-auto"><Filter className="h-4 w-4" /> Filters</Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>In Stock</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts?.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="font-bold text-primary">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono uppercase">{p.id.slice(-8)}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                        <TableCell>
                          {p.serialNumberTrackingRequired ? (
                            <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 gap-1 text-[10px]">
                              <Scan className="h-3 w-3" /> Serialized
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-200 text-slate-600 text-[10px]">Qty Based</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={cn("text-xs md:text-sm font-bold", (p.currentStock || 0) <= (p.minStockLevel || 0) ? "text-red-600" : "text-foreground")}>
                            {p.currentStock || 0} Units
                          </div>
                          <div className="text-[10px] text-muted-foreground">Min: {p.minStockLevel}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-bold">৳{p.unitPrice?.toFixed(2)}</div>
                          <div className="text-[10px] text-muted-foreground">Cost: ৳{p.costPrice?.toFixed(2)}</div>
                        </TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-insights">
          {forecast ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-xl border-none shadow-md">
                <CardHeader className="bg-accent/5 border-b"><CardTitle className="text-lg">Demand Analysis</CardTitle></CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {forecast.forecasts.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed">
                      <div><p className="font-bold">{f.productName}</p><p className="text-xs text-muted-foreground">Forecast: {f.predictedDemandNextPeriod} Units</p></div>
                      <Badge className="bg-primary">{f.recommendedReorderPoint} Reorder</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="rounded-xl border-none shadow-md bg-primary text-white">
                <CardHeader><CardTitle className="text-lg">Strategy</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {forecast.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-2 items-start bg-white/10 p-3 rounded-lg"><Zap className="h-4 w-4 mt-1 shrink-0" /><p className="text-sm">{rec}</p></div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-xl border border-dashed">
              <Zap className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="font-bold">No Data Points</h3>
              <p className="text-sm text-muted-foreground mt-1">Run AI Intelligence to generate insights.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Product Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Product Name</Label><Input name="name" required placeholder="e.g. Hikvision 4K Camera" /></div>
              <div className="space-y-2"><Label>SKU / Model</Label><Input name="sku" required placeholder="HIK-4K-PRO" /></div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="space-y-0.5">
                <Label className="text-purple-900 font-bold">Enable Serial Tracking</Label>
                <p className="text-[10px] text-purple-700">Track every unit uniquely by IMEI/ID</p>
              </div>
              <Switch checked={serialRequired} onCheckedChange={setSerialRequired} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Unit Cost (৳)</Label><Input name="costPrice" type="number" step="0.01" required /></div>
              <div className="space-y-2"><Label>Selling Price (৳)</Label><Input name="unitPrice" type="number" step="0.01" required /></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Opening Qty</Label><Input name="currentStock" type="number" required defaultValue="0" /></div>
              <div className="space-y-2"><Label>Min Stock Level</Label><Input name="minStockLevel" type="number" required defaultValue="5" /></div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Save to Database"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
