
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
  Tool,
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

const MAIN_MODULES = [
  { name: "dashboard", key: "dashboard", icon: LayoutDashboard, path: "/", color: "text-blue-500" },
  { name: "sales", key: "sales", icon: ShoppingCart, path: "/sales", color: "text-green-500" },
  { name: "quotations", key: "quotations", icon: FileText, path: "/quotations", color: "text-amber-500" },
  { name: "purchases", key: "purchases", icon: Package, path: "/purchases", color: "text-orange-500" },
  { name: "returns", key: "returns", icon: RotateCcw, path: "/returns", color: "text-red-500" },
  { name: "inventory", key: "inventory", icon: Boxes, path: "/inventory", color: "text-sky-500" },
  { name: "serialTracking", key: "serialTracking", icon: Scan, path: "/serial-inventory", color: "text-purple-500" },
  { name: "projectBilling", key: "project-billing", icon: ClipboardList, path: "/projects", color: "text-teal-500" },
  { name: "contracts", key: "contracts", icon: Wrench, path: "/contracts", color: "text-indigo-500" },
  { name: "customers", key: "customers", icon: Users, path: "/customers", color: "text-blue-400" },
  { name: "suppliers", key: "suppliers", icon: Truck, path: "/suppliers", color: "text-rose-500" },
  { name: "accounts", key: "accounts", icon: Wallet, path: "/accounts", color: "text-yellow-500" },
  { name: "expenses", key: "expenses", icon: Receipt, path: "/expenses", color: "text-red-400" },
  { name: "support", key: "support", icon: GitPullRequest, path: "/support", color: "text-indigo-400" },
  { name: "crm", key: "crm", icon: Target, path: "/crm", color: "text-rose-600" },
  { name: "hrm", key: "hrm", icon: Briefcase, path: "/hrm", color: "text-purple-400" },
  { name: "branches", key: "branches", icon: Building2, path: "/branches", color: "text-slate-500" },
  { name: "reports", key: "reports", icon: BarChart3, path: "/reports", color: "text-blue-600" },
  { name: "ai", key: "ai", icon: BrainCircuit, path: "/ai-forecasting", color: "text-violet-600" },
  { name: "users", key: "users", icon: UserRoundCog, path: "/users", color: "text-violet-500" },
]

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

const ADMIN_ITEMS = [
  { name: "auditLogs", key: "audit", icon: ShieldAlert, path: "/administration/audit-logs" },
  { name: "loginHistory", key: "audit", icon: History, path: "/administration/login-history" },
]

/**
 * Redesigned Sidebar:
 * - White background (#FFFFFF)
 * - Light blue active state
 * - Clean icons matching image
 */
export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const auth = useAuth()
  const router = useRouter()
  const { can } = usePermissions()
  const { settings } = useSettings()
  const { t } = useTranslation()

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const isMasterActive = pathname.startsWith('/master')
  const isAdminActive = pathname.startsWith('/administration')

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-100 bg-white shadow-sm">
      <SidebarHeader className="h-[64px] flex items-center px-4 border-b border-slate-50">
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
      
      <SidebarContent className="py-4 custom-scrollbar bg-white">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-1 px-3">
            {MAIN_MODULES.filter(m => can(m.key, 'view')).map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))} 
                  tooltip={t(item.name)} 
                  className={cn(
                    "h-10 px-3 transition-all rounded-xl",
                    (pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))) 
                      ? "bg-blue-50 text-blue-600" 
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Link href={item.path} className="flex items-center gap-3">
                    <item.icon className={cn("h-4.5 w-4.5 shrink-0", (pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))) ? "text-blue-600" : item.color)} />
                    <span className="text-[12px] font-bold uppercase tracking-tight">{t(item.name)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {/* Master Management Group */}
            {can('masterManagement', 'view') && (
              <Collapsible defaultOpen={isMasterActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      isActive={isMasterActive}
                      tooltip={t('master')}
                      className={cn(
                        "h-10 px-3 transition-all rounded-xl",
                        isMasterActive ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <Database className={cn("h-4.5 w-4.5 shrink-0", isMasterActive ? "text-blue-600" : "text-orange-500")} />
                      <span className="text-[12px] font-bold uppercase tracking-tight">{t('master')}</span>
                      <ChevronRight className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
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
                              "h-8 px-4 rounded-lg",
                              pathname === sub.path ? "text-blue-600 font-bold bg-blue-50/50" : "text-slate-400 hover:text-slate-600"
                            )}
                          >
                            <Link href={sub.path}>
                              <span className="text-[11px] font-bold">{t(sub.name)}</span>
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

      <SidebarFooter className="border-t border-slate-50 p-2 bg-white">
        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-10 px-3 rounded-xl">
              <LogOut className="h-4.5 w-4.5 text-red-500" />
              <span className="text-[12px] font-bold uppercase tracking-tight">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
