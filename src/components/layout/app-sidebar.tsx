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
  Wrench, 
  Users, 
  Truck, 
  Wallet, 
  BarChart3, 
  Settings, 
  LogOut, 
  Target, 
  Receipt, 
  Building2, 
  Database,
  ClipboardList,
  ChevronRight,
  CreditCard,
  ShieldAlert,
  History,
  Lock,
  BrainCircuit,
  UserRoundCog,
  Briefcase,
  GitPullRequest,
  Plus,
  LayoutGrid,
  FileBadge,
  Archive,
  HardHat,
  Monitor
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  key: string
  icon: any
  path: string
  color: string
  hoverBg: string // Predefined hover class
}

const NAV_ITEMS_MAP: Record<string, NavItem> = {
  dashboard: { name: "dashboard", key: "dashboard", icon: LayoutDashboard, path: "/", color: "text-blue-600", hoverBg: "hover:bg-black" },
  sales: { name: "sales", key: "sales", icon: ShoppingCart, path: "/sales", color: "text-green-600", hoverBg: "hover:bg-black" },
  quotations: { name: "quotations", key: "quotations", icon: FileText, path: "/quotations", color: "text-amber-600", hoverBg: "hover:bg-black" },
  dispatch: { name: "dispatch", key: "dispatch", icon: Truck, path: "/challans", color: "text-orange-600", hoverBg: "hover:bg-black" },
  purchases: { name: "purchases", key: "purchases", icon: Package, path: "/purchases", color: "text-orange-700", hoverBg: "hover:bg-black" },
  returns: { name: "returns", key: "returns", icon: RotateCcw, path: "/returns", color: "text-red-600", hoverBg: "hover:bg-black" },
  inventory: { name: "inventory", key: "inventory", icon: Boxes, path: "/inventory", color: "text-sky-600", hoverBg: "hover:bg-black" },
  serialTracking: { name: "serialTracking", key: "serialTracking", icon: Scan, path: "/serial-inventory", color: "text-purple-600", hoverBg: "hover:bg-black" },
  projectBilling: { name: "projectBilling", key: "project-billing", icon: ClipboardList, path: "/projects", color: "text-teal-600", hoverBg: "hover:bg-black" },
  contracts: { name: "contracts", key: "contracts", icon: Wrench, path: "/contracts", color: "text-indigo-600", hoverBg: "hover:bg-black" },
  customers: { name: "customers", key: "customers", icon: Users, path: "/customers", color: "text-blue-500", hoverBg: "hover:bg-black" },
  suppliers: { name: "suppliers", key: "suppliers", icon: Truck, path: "/suppliers", color: "text-rose-600", hoverBg: "hover:bg-black" },
  accounts: { name: "accounts", key: "accounts", icon: Wallet, path: "/accounts", color: "text-yellow-700", hoverBg: "hover:bg-black" },
  expenses: { name: "expenses", key: "expenses", icon: Receipt, path: "/expenses", color: "text-red-500", hoverBg: "hover:bg-black" },
  support: { name: "support", key: "support", icon: GitPullRequest, path: "/support", color: "text-indigo-500", hoverBg: "hover:bg-black" },
  crm: { name: "crm", key: "crm", icon: Target, path: "/crm", color: "text-rose-700", hoverBg: "hover:bg-black" },
  hrm: { name: "hrm", key: "hrm", icon: Briefcase, path: "/hrm", color: "text-purple-500", hoverBg: "hover:bg-black" },
  branches: { name: "branches", key: "branches", icon: Building2, path: "/branches", color: "text-slate-700", hoverBg: "hover:bg-black" },
  reports: { name: "reports", key: "reports", icon: BarChart3, path: "/reports", color: "text-blue-700", hoverBg: "hover:bg-black" },
  ai: { name: "ai", key: "ai", icon: BrainCircuit, path: "/ai-forecasting", color: "text-violet-700", hoverBg: "hover:bg-black" },
  users: { name: "users", key: "users", icon: UserRoundCog, path: "/users", color: "text-violet-600", hoverBg: "hover:bg-black" },
  settings: { name: "settings", key: "settings", icon: Settings, path: "/settings", color: "text-slate-600", hoverBg: "hover:bg-black" },
};

const MASTER_DATA_ITEMS = [
  { name: "units", path: "/master/units" },
  { name: "categories", path: "/master/categories" },
  { name: "brands", path: "/master/brands" },
  { name: "models", path: "/master/models" },
  { name: "productTypes", path: "/master/product-types" },
  { name: "serviceTypes", path: "/master/service-types" },
  { name: "warrantyTypes", path: "/master/warranty-types" },
  { name: "customFields", path: "/master/custom-fields" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const auth = useAuth()
  const router = useRouter()
  const { can } = usePermissions()
  const { settings } = useSettings()
  const { t } = useTranslation()

  const sidebarBg = settings?.sidebarBgColor || "#FFFFFF"
  const sidebarText = settings?.sidebarTextColor || "#000000"
  const defaultHoverBg = settings?.sidebarHoverColor || "#000000"

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const isMasterActive = pathname.startsWith('/master')
  const menuOrder = settings?.sidebarMenuOrder || Object.keys(NAV_ITEMS_MAP);

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-slate-100 shadow-sm"
      style={{ backgroundColor: sidebarBg } as React.CSSProperties}
    >
      <SidebarHeader 
        className="h-[64px] flex items-center px-4 border-b border-slate-50"
        style={{ backgroundColor: sidebarBg } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
            {settings?.companyLogo ? <img src={settings.companyLogo} className="w-full h-full object-contain p-1.5" alt="Logo" /> : "W"}
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="font-black text-slate-900 text-[14px] tracking-tight leading-none uppercase">Warrior Tech</span>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 uppercase">ERP System</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent 
        className="py-4 custom-scrollbar"
        style={{ backgroundColor: sidebarBg } as React.CSSProperties}
      >
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-1 px-3">
            {menuOrder.map((key) => {
              const item = NAV_ITEMS_MAP[key];
              if (!item || !can(item.key, 'view')) return null;

              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              
              return (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive} 
                    tooltip={t(item.name)} 
                    className={cn(
                      "h-10 px-3 transition-all rounded-xl group",
                      isActive 
                        ? "bg-slate-100 border-l-4 border-blue-600" 
                        : "hover:bg-black hover:text-white"
                    )}
                    style={{ 
                      color: isActive ? "#000000" : sidebarText,
                      // @ts-ignore
                      '--sidebar-hover-bg': "black",
                      '--sidebar-hover-text': "white",
                    } as React.CSSProperties}
                  >
                    <Link 
                      href={item.path} 
                      className="flex items-center gap-3"
                    >
                      <item.icon className={cn(
                        "h-4.5 w-4.5 shrink-0 transition-colors", 
                        isActive ? "text-blue-600" : item.color,
                        "group-hover:text-white"
                      )} />
                      <span className="text-[12px] font-black uppercase tracking-tight">{t(item.name)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

            {/* Master Management Group */}
            {can('masterManagement', 'view') && (
              <Collapsible defaultOpen={isMasterActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      isActive={isMasterActive}
                      tooltip={t('master')}
                      className={cn(
                        "h-10 px-3 transition-all rounded-xl group hover:bg-black hover:text-white",
                        isMasterActive ? "bg-slate-100 border-l-4 border-orange-600" : ""
                      )}
                      style={{ color: isMasterActive ? "#000000" : sidebarText } as React.CSSProperties}
                    >
                      <div className="flex items-center gap-3 w-full h-full rounded-xl">
                        <Database className={cn(
                          "h-4.5 w-4.5 shrink-0 transition-colors", 
                          isMasterActive ? "text-orange-600" : "text-orange-500",
                          "group-hover:text-white"
                        )} />
                        <span className="text-[12px] font-black uppercase tracking-tight">{t('master')}</span>
                        <ChevronRight className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 ml-4 border-l border-slate-100 gap-0.5">
                      {MASTER_DATA_ITEMS.map((sub) => (
                        <SidebarMenuItem key={sub.path}>
                          <SidebarMenuButton 
                            asChild 
                            isActive={pathname === sub.path}
                            className={cn(
                              "h-8 px-4 rounded-lg transition-all",
                              pathname === sub.path 
                                ? "text-blue-600 font-black bg-blue-50/50" 
                                : "hover:text-white"
                            )}
                            style={{ 
                               color: pathname === sub.path ? "blue" : sidebarText,
                               // @ts-ignore
                               '--sub-hover-bg': defaultHoverBg,
                            } as React.CSSProperties}
                          >
                            <Link href={sub.path} className="hover:bg-[var(--sub-hover-bg)]">
                              <span className="text-[11px] uppercase tracking-tighter">{t(sub.name)}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter 
        className="border-t border-slate-50 p-2"
        style={{ backgroundColor: sidebarBg } as React.CSSProperties}
      >
        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              className="font-black h-10 px-3 rounded-xl transition-all hover:bg-red-50 group/logout"
              style={{ color: sidebarText } as React.CSSProperties}
            >
              <div className="flex items-center gap-3 w-full h-full rounded-xl">
                <LogOut className="h-4.5 w-4.5 text-red-500 transition-transform group-hover/logout:scale-110" />
                <span className="text-[12px] font-black uppercase tracking-tight">Logout</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
