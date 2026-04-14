"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Plus, Search, Loader2, MoreVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"

export default function ReturnsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();

  const returnsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_returns"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: returns, isLoading } = useCollection(returnsQuery);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-red-600">Returns & RMA</h1>
          <p className="text-muted-foreground mt-1">Manage product returns and credit notes</p>
        </div>
        <Button variant="destructive" className="gap-2 rounded-full">
          <Plus className="h-4 w-4" />
          Process Return
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
      ) : returns && returns.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Return ID</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-bold">#RET-{r.id.slice(-6)}</TableCell>
                  <TableCell>{r.reason}</TableCell>
                  <TableCell className="font-semibold text-red-600">-${r.returnAmount?.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">{r.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
            <RotateCcw className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">No Returns Pending</h2>
          <p className="text-muted-foreground max-w-sm mt-2">Customer returns and supplier credit notes will appear in this section.</p>
        </div>
      )}
    </div>
  )
}
