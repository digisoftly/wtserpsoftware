"use client"

import * as React from "react"
import { LayoutDashboard, ShoppingCart, FileText, Package, RotateCcw, Boxes, Scan, Folder, Layers, Wrench, Users, Truck, Wallet, UserRoundCog, BarChart3, TrendingUp, Database, Settings, ShieldCheck, LogOut, Target, LifeBuoy, Receipt, Building2 } from "lucide-react"

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, useSidebar } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { useSettings } from "@/hooks/use-settings"

const MODULES = [
  { name: "Dashboard", key: "dashboard", icon: LayoutDashboard, color: "text-blue-500", path: "/" },
  { name: "Sales", key: "sales", icon: ShoppingCart, color: "text-green-500", path: "/sales" },
  { name: "Quotations", key: "quotations", icon: FileText, color: "text-purple-500", path: "/quotations" },
  { name: "Purchase", key: "purchases", icon: Package, color: "text-orange-500", path: "/purchases" },
  { name: "Returns", key: "returns", icon: RotateCcw, color: "text-red-500", path: "/returns" },
  { name: "Inventory", key: "inventory", icon: Boxes, color: "text-yellow-600", path: "/inventory" },
  { name: "Serial Tracking", key: "serial-inventory", icon: Scan, color: "text-blue-400", path: "/serial-inventory" },
  { name: "Projects", key: "projects", icon: Folder, color: "text-teal-500", path: "/projects" },
  { name: "Billing", key: "project-billing", icon: Layers, color: "text-violet-500", path: "/project-billing" },
  { name: "Contracts", key: "contracts", icon: Wrench, color: "text-emerald-500", path: "/contracts" },
  { name: "Customers", key: "customers", icon: Users, color: "text-cyan-500", path: "/customers" },
  { name: "Suppliers", key: "suppliers", icon: Truck, color: "text-amber-700", path: "/suppliers" },
  { name: "Accounts", key: "accounts", icon: Wallet, color: "text-blue-600", path: "/accounts" },
  { name: "Expenses", key: "expenses", icon: Receipt, color: "text-red-400", path: "/expenses" },
  { name: "Support", key: "support", icon: LifeBuoy, color: "text-indigo-500", path: "/support" },
  { name: "CRM", key: "crm", icon: Target, color: "text-rose-500", path: "/crm" },
  { name: "HRM", key: "hrm", icon: UserRoundCog, color: "text-purple-500", path: "/hrm" },
  { name: "Branches", key: "branches", icon: Building2, color: "text-blue-600", path: "/branches" },
  { name: "Reports", key: "reports", icon: BarChart3, color: "text-indigo-400", path: "/reports" },
  { name: "AI", key: "ai-forecasting", icon: TrendingUp, color: "text-violet-500", path: "/ai-forecasting" },
  { name: "Settings", key: "settings", icon: Settings, color: "text-rose-500", path: "/settings" },
  { name: "Users", key: "users", icon: ShieldCheck, color: "text-violet-600", path: "/users" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const auth = useAuth()
  const router = useRouter()
  const { can } = usePermissions()
  const { settings } = useSettings()

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const allowedModules = MODULES.filter(m => can(m.key, 'view'))

  return (
    <Sidebar collapsible="icon" className="border-r shadow-none bg-[#111827]">
      <SidebarHeader className="h-14 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg overflow-hidden">
            {settings?.companyLogo ? <img src={settings.companyLogo} className="w-full h-full object-contain" /> : "W"}
          </div>
          {state === "expanded" && <span className="font-bold text-white text-sm">Warrior ERP</span>}
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarMenu>
            {allowedModules.map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton asChild isActive={pathname === item.path} tooltip={item.name} className="hover:bg-white/5 active:bg-blue-600/10">
                  <Link href={item.path} className="flex items-center gap-3">
                    <item.icon className={`${item.color} h-4 w-4 shrink-0`} />
                    <span className="text-[13px] font-medium text-white/70 group-data-[active=true]:text-white">{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/5 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-red-400 hover:bg-red-400/10 h-9">
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="text-[13px]">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}