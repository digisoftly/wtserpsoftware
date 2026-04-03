"use client"

import * as React from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Truck,
  RotateCcw,
  Package,
  Layers,
  Users,
  Building2,
  Wallet,
  Users2,
  BarChart3,
  Database,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronDown
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
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const modules = [
  { name: "Dashboard", icon: LayoutDashboard, color: "text-blue-400", path: "/" },
  { name: "Sales", icon: ShoppingCart, color: "text-green-400", path: "/sales" },
  { name: "Quotation", icon: FileText, color: "text-purple-400", path: "/quotations" },
  { name: "Purchase", icon: Truck, color: "text-orange-400", path: "/purchases" },
  { name: "Sales Return", icon: RotateCcw, color: "text-red-400", path: "/sales-returns" },
  { name: "Purchase Return", icon: RotateCcw, color: "text-amber-600", path: "/purchase-returns" },
  { name: "Inventory", icon: Package, color: "text-yellow-400", path: "/inventory" },
  { name: "Projects", icon: Layers, color: "text-teal-400", path: "/projects" },
  { name: "Customers", icon: Users, color: "text-cyan-400", path: "/customers" },
  { name: "Suppliers", icon: Building2, color: "text-stone-400", path: "/suppliers" },
  { name: "Accounts", icon: Wallet, color: "text-indigo-400", path: "/accounts" },
  { name: "HRM", icon: Users2, color: "text-violet-400", path: "/hrm" },
  { name: "Reports", icon: BarChart3, color: "text-blue-500", path: "/reports" },
  { name: "Backup", icon: Database, color: "text-gray-400", path: "/backup", adminOnly: true },
  { name: "Settings", icon: Settings, color: "text-pink-400", path: "/settings" },
  { name: "Users & Roles", icon: ShieldCheck, color: "text-violet-500", path: "/users" },
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