"use client"

import * as React from "react"
import { 
  TrendingUp, 
  ShoppingCart, 
  CreditCard, 
  Users, 
  AlertTriangle, 
  ClipboardList,
  Package,
  CalendarDays,
  Briefcase
} from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const kpis = [
    { title: "Total Sales", value: "$128,430", icon: TrendingUp, colorClass: "bg-blue-500", trend: { value: 12, isPositive: true } },
    { title: "Monthly Purchases", value: "$45,200", icon: ShoppingCart, colorClass: "bg-orange-500", trend: { value: 8, isPositive: false } },
    { title: "Net Profit", value: "$83,230", icon: CreditCard, colorClass: "bg-green-500", trend: { value: 15, isPositive: true } },
    { title: "Pending Projects", value: "12", icon: ClipboardList, colorClass: "bg-teal-500", trend: { value: 4, isPositive: true } },
    { title: "Low Stock Items", value: "8", icon: AlertTriangle, colorClass: "bg-red-500" },
    { title: "Active Customers", value: "1,240", icon: Users, colorClass: "bg-cyan-500", trend: { value: 2, isPositive: true } },
    { title: "Total Employees", value: "48", icon: Briefcase, colorClass: "bg-violet-500" },
    { title: "Today's Attendance", value: "42/48", icon: CalendarDays, colorClass: "bg-indigo-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Operational Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time performance metrics for Dhaka Main Branch</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white">Export PDF</Button>
          <Button className="bg-primary hover:bg-primary/90">Add Entry</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpis.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">Recent Transactions</CardTitle>
              <CardDescription>Latest sales and purchase movements</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer/Supplier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: "INV-2023-001", entity: "Global Tech Inc", amount: "$1,200.00", status: "Paid", color: "bg-green-100 text-green-700" },
                  { id: "PUR-2023-042", entity: "A1 Logistics", amount: "$4,500.00", status: "Partial", color: "bg-blue-100 text-blue-700" },
                  { id: "INV-2023-002", entity: "Sarah Johnson", amount: "$850.00", status: "Due", color: "bg-red-100 text-red-700" },
                  { id: "INV-2023-003", entity: "Cyber Nexus", amount: "$2,100.00", status: "Paid", color: "bg-green-100 text-green-700" },
                  { id: "PUR-2023-043", entity: "Mega Hardware", amount: "$300.00", status: "Paid", color: "bg-green-100 text-green-700" },
                ].map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.entity}</TableCell>
                    <TableCell>{item.amount}</TableCell>
                    <TableCell>
                      <Badge className={item.color} variant="secondary">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline">Inventory Alerts</CardTitle>
            <CardDescription>Items below reorder point</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "CCTV Camera 4K", stock: 2, reorder: 5, status: "Critical" },
              { name: "Fiber Optic Cable", stock: 120, reorder: 200, status: "Low" },
              { name: "Network Switch 24P", stock: 1, reorder: 3, status: "Critical" },
              { name: "RJ45 Connectors", stock: 45, reorder: 100, status: "Low" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    item.status === "Critical" ? "bg-red-500" : "bg-orange-500"
                  )} />
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Stock: {item.stock} / Min: {item.reorder}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs">Order</Button>
              </div>
            ))}
            <Button variant="link" className="w-full text-sm text-primary">View Inventory Forecast</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}