"use client"

import * as React from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  RotateCcw,
  Boxes,
  Scan,
  Folder,
  Layers,
  Wrench,
  Users,
  Truck,
  Wallet,
  UserRoundCog,
  BarChart3,
  TrendingUp,
  Database,
  Settings,
  ShieldCheck,
  LogOut
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  useSidebar
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const modules = [
  { name: "Dashboard", icon: LayoutDashboard, color: "text-blue-500", path: "/" },
  { name: "Sales", icon: ShoppingCart, color: "text-green-500", path: "/sales" },
  { name: "Quotation", icon: FileText, color: "text-purple-500", path: "/quotations" },
  { name: "Purchase", icon: Package, color: "text-orange-500", path: "/purchases" },
  { name: "returns", icon: RotateCcw, color: "text-red-500", path: "/returns" },
  { name: "Products & Services", icon: Boxes, color: "text-yellow-600", path: "/inventory" },
  { name: "Serial Inventory", icon: Scan, color: "text-blue-400", path: "/serial-inventory" },
  { name: "Projects", icon: Folder, color: "text-teal-500", path: "/projects" },
  { name: "Project Billing", icon: Layers, color: "text-violet-500", path: "/project-billing" },
  { name: "Service Contracts", icon: Wrench, color: "text-emerald-500", path: "/contracts" },
  { name: "Customers", icon: Users, color: "text-cyan-500", path: "/customers" },
  { name: "Suppliers", icon: Truck, color: "text-amber-700", path: "/suppliers" },
  { name: "Accounts", icon: Wallet, color: "text-blue-600", path: "/accounts" },
  { name: "HRM", icon: UserRoundCog, color: "text-purple-500", path: "/hrm" },
  { name: "Reports", icon: BarChart3, color: "text-indigo-400", path: "/reports" },
  { name: "AI Forecasting", icon: TrendingUp, color: "text-violet-500", path: "/ai-forecasting" },
  { name: "Backup", icon: Database, color: "text-gray-500", path: "/backup" },
  { name: "Settings", icon: Settings, color: "text-rose-500", path: "/settings" },
  { name: "Users & Roles", icon: ShieldCheck, color: "text-violet-600", path: "/users" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-xl">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-headline font-bold text-xl shadow-lg ring-2 ring-primary/20">
            W
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sidebar-foreground leading-none">WarriorERP</span>
              <span className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest mt-1">Tech System</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2 scrollbar-hide">
        <SidebarGroup>
          <SidebarMenu>
            {modules.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.path}
                  tooltip={item.name}
                  className="group transition-all duration-200"
                >
                  <Link href={item.path} className="flex items-center w-full">
                    <item.icon className={`${item.color} shrink-0`} />
                    <span className="ml-3 font-medium">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-red-400 hover:bg-red-400/10 hover:text-red-300">
              <LogOut className="shrink-0" />
              <span className="ml-3 font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}