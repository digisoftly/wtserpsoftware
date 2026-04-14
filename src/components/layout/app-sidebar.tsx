
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
  LogOut,
  Target,
  LifeBuoy,
  Receipt,
  Building2
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
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { useSettings } from "@/hooks/use-settings"

const ALL_MODULES = [
  { name: "Dashboard", key: "dashboard", icon: LayoutDashboard, color: "text-blue-500", path: "/" },
  { name: "Sales", key: "sales", icon: ShoppingCart, color: "text-green-500", path: "/sales" },
  { name: "Quotation", key: "quotations", icon: FileText, color: "text-purple-500", path: "/quotations" },
  { name: "Purchase", key: "purchases", icon: Package, color: "text-orange-500", path: "/purchases" },
  { name: "Returns", key: "returns", icon: RotateCcw, color: "text-red-500", path: "/returns" },
  { name: "Inventory", key: "inventory", icon: Boxes, color: "text-yellow-600", path: "/inventory" },
  { name: "Serial Inventory", key: "serial-inventory", icon: Scan, color: "text-blue-400", path: "/serial-inventory" },
  { name: "Projects", key: "projects", icon: Folder, color: "text-teal-500", path: "/projects" },
  { name: "Project Billing", key: "project-billing", icon: Layers, color: "text-violet-500", path: "/project-billing" },
  { name: "Service Contracts", key: "contracts", icon: Wrench, color: "text-emerald-500", path: "/contracts" },
  { name: "Customers", key: "customers", icon: Users, color: "text-cyan-500", path: "/customers" },
  { name: "Suppliers", key: "suppliers", icon: Truck, color: "text-amber-700", path: "/suppliers" },
  { name: "Accounts", key: "accounts", icon: Wallet, color: "text-blue-600", path: "/accounts" },
  { name: "Expenses", key: "expenses", icon: Receipt, color: "text-red-400", path: "/expenses" },
  { name: "Support", key: "support", icon: LifeBuoy, color: "text-indigo-500", path: "/support" },
  { name: "CRM (Leads)", key: "crm", icon: Target, color: "text-rose-500", path: "/crm" },
  { name: "HRM", key: "hrm", icon: UserRoundCog, color: "text-purple-500", path: "/hrm" },
  { name: "Branches", key: "branches", icon: Building2, color: "text-blue-600", path: "/branches" },
  { name: "Reports", key: "reports", icon: BarChart3, color: "text-indigo-400", path: "/reports" },
  { name: "AI Forecasting", key: "ai-forecasting", icon: TrendingUp, color: "text-violet-500", path: "/ai-forecasting" },
  { name: "Backup", key: "backup", icon: Database, color: "text-gray-500", path: "/backup" },
  { name: "Settings", key: "settings", icon: Settings, color: "text-rose-500", path: "/settings" },
  { name: "Users & Roles", key: "users", icon: ShieldCheck, color: "text-violet-600", path: "/users" },
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

  // Determine menu order from settings or use default ALL_MODULES order
  const orderedModules = React.useMemo(() => {
    const customOrder = settings?.sidebarMenuOrder as string[] | undefined;
    if (!customOrder || !Array.isArray(customOrder)) return ALL_MODULES;

    const moduleMap = new Map(ALL_MODULES.map(m => [m.key, m]));
    const ordered = customOrder
      .map(key => moduleMap.get(key))
      .filter((m): m is typeof ALL_MODULES[0] => !!m);

    // Add any missing modules that are in ALL_MODULES but not in customOrder
    ALL_MODULES.forEach(m => {
      if (!customOrder.includes(m.key)) {
        ordered.push(m);
      }
    });

    return ordered;
  }, [settings?.sidebarMenuOrder]);

  // Filter modules based on View permission
  const allowedModules = orderedModules.filter(m => can(m.key, 'view'))

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-xl">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-headline font-bold text-xl shadow-lg ring-2 ring-primary/20 overflow-hidden">
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain p-1 bg-white" />
            ) : (
              <span>{settings?.companyName?.[0] || "W"}</span>
            )}
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sidebar-foreground leading-none truncate max-w-[120px]">
                {settings?.companyName || "WarriorERP"}
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest mt-1">Tech System</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2 scrollbar-hide overflow-y-auto">
        <SidebarGroup>
          <SidebarMenu>
            {allowedModules.map((item) => (
              <SidebarMenuItem key={item.key}>
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
            <SidebarMenuButton 
              onClick={handleLogout}
              className="text-red-400 hover:bg-red-400/10 hover:text-red-300 w-full"
            >
              <LogOut className="shrink-0" />
              <span className="ml-3 font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
