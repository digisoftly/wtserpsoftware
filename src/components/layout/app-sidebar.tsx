
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
  ChevronRight,
  UserRoundCog,
  Briefcase,
  GitPullRequest,
  ClipboardList,
  Clock,
  Heart,
  CreditCard,
  FileBarChart,
  Layers,
  ListTree,
  Tag,
  Box,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Archive,
  Zap
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
import { Button } from "@/components/ui/button"

interface NavItem {
  name: string
  key: string
  icon: any
  path: string
  color: string
}

const NAV_ITEMS_MAP: Record<string, NavItem> = {
  dashboard: { name: "dashboard", key: "dashboard", icon: LayoutDashboard, path: "/", color: "text-blue-600" },
  sales: { name: "sales", key: "sales", icon: ShoppingCart, path: "/sales", color: "text-green-600" },
  quotations: { name: "quotations", key: "quotations", icon: FileText, path: "/quotations", color: "text-amber-600" },
  dispatch: { name: "dispatch", key: "dispatch", icon: Truck, path: "/challans", color: "text-orange-600" },
  purchases: { name: "purchases", key: "purchases", icon: Package, path: "/purchases", color: "text-orange-700" },
  returns: { name: "returns", key: "returns", icon: RotateCcw, path: "/returns", color: "text-red-600" },
  inventory: { name: "inventory", key: "inventory", icon: Boxes, path: "/inventory", color: "text-sky-600" },
  serialTracking: { name: "serialTracking", key: "serialTracking", icon: Scan, path: "/serial-inventory", color: "text-purple-600" },
  projectBilling: { name: "projectBilling", key: "projectBilling", icon: ClipboardList, path: "/projects", color: "text-teal-600" },
  contracts: { name: "contracts", key: "contracts", icon: Wrench, path: "/contracts", color: "text-indigo-600" },
  customers: { name: "customers", key: "customers", icon: Users, path: "/customers", color: "text-blue-500" },
  suppliers: { name: "suppliers", key: "suppliers", icon: Truck, path: "/suppliers", color: "text-rose-600" },
  accounts: { name: "accounts", key: "accounts", icon: Wallet, path: "/accounts", color: "text-yellow-700" },
  expenses: { name: "expenses", key: "expenses", icon: Receipt, path: "/expenses", color: "text-red-500" },
  masterManagement: { name: "master", key: "masterManagement", icon: Database, path: "/master", color: "text-slate-600" },
  support: { name: "support", key: "support", icon: GitPullRequest, path: "/support", color: "text-indigo-500" },
  crm: { name: "crm", key: "crm", icon: Target, path: "/crm", color: "text-rose-700" },
  hrm: { name: "hrm", key: "hrm", icon: Briefcase, path: "/hrm", color: "text-purple-600" },
  branches: { name: "branches", key: "branches", icon: Building2, path: "/branches", color: "text-slate-700" },
  reports: { name: "reports", key: "reports", icon: BarChart3, path: "/reports", color: "text-blue-700" },
  ai: { name: "ai", key: "ai", icon: Zap, path: "/ai-forecasting", color: "text-violet-600" },
  users: { name: "users", key: "users", icon: UserRoundCog, path: "/users", color: "text-violet-600" },
  settings: { name: "settings", key: "settings", icon: Settings, path: "/settings", color: "text-slate-600" },
};

const MASTER_SUB_MENUS = [
  { name: "units", path: "/master/units", icon: Database },
  { name: "categories", path: "/master/categories", icon: Layers },
  { name: "brands", path: "/master/brands", icon: Tag },
  { name: "models", path: "/master/models", icon: Box },
  { name: "productTypes", path: "/master/product-types", icon: Boxes },
  { name: "serviceTypes", path: "/master/service-types", icon: Wrench },
  { name: "warrantyTypes", path: "/master/warranty-types", icon: ShieldCheck },
  { name: "customFields", path: "/master/custom-fields", icon: Fingerprint },
];

const HRM_SUB_MENUS = [
  { name: "hrmDashboard", path: "/hrm", icon: LayoutDashboard },
  { name: "employees", path: "/hrm/employees", icon: Users },
  { name: "attendance", path: "/hrm/attendance", icon: Clock },
  { name: "leave", path: "/hrm/leave", icon: Heart },
  { name: "payroll", path: "/hrm/payroll", icon: CreditCard },
];

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
  const sidebarHover = settings?.sidebarHoverColor || "#E5E7EB" 
  const sidebarActive = settings?.sidebarActiveColor || "#E5E7EB"

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

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

              const isHrm = item.key === 'hrm';
              const isMaster = item.key === 'masterManagement';
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));

              if (isHrm || isMaster) {
                const subItems = isHrm ? HRM_SUB_MENUS : MASTER_SUB_MENUS;
                const sectionColor = isHrm ? "text-purple-600" : "text-slate-600";

                return (
                  <Collapsible key={item.key} defaultOpen={isActive} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          isActive={isActive}
                          tooltip={t(item.name)}
                          className={cn("h-11 px-3 transition-all rounded-xl group", isActive ? "font-black" : "")}
                          style={{ 
                            color: isActive ? "#0056B3" : sidebarText,
                            backgroundColor: isActive ? sidebarActive : "transparent",
                          } as React.CSSProperties}
                        >
                          <div className="flex items-center gap-3 w-full h-full">
                            <item.icon className={cn("h-5 w-5 shrink-0", sectionColor, isActive && "text-blue-600")} />
                            {state === "expanded" && (
                              <>
                                <span className="text-[12px] font-black uppercase tracking-tight">{t(item.name)}</span>
                                <ChevronRight className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </>
                            )}
                          </div>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenu className="mt-1 ml-4 border-l border-slate-100 gap-0.5">
                          {subItems.map((sub) => (
                            <SidebarMenuItem key={sub.path}>
                              <SidebarMenuButton 
                                asChild 
                                isActive={pathname === sub.path} 
                                className="h-9 px-4 rounded-lg"
                                style={{ 
                                  color: pathname === sub.path ? "#0056B3" : sidebarText,
                                  backgroundColor: pathname === sub.path ? sidebarActive : "transparent"
                                } as React.CSSProperties}
                              >
                                <Link href={sub.path}>
                                  <sub.icon className="h-3.5 w-3.5 mr-2 opacity-70" />
                                  <span className="text-[10px] font-black uppercase">{t(sub.name)}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }

              return (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive} 
                    tooltip={t(item.name)} 
                    className={cn(
                      "h-11 px-3 transition-all rounded-xl group relative overflow-hidden",
                      isActive ? "font-black" : ""
                    )}
                    style={{ 
                      color: isActive ? "#0056B3" : sidebarText,
                      backgroundColor: isActive ? sidebarActive : "transparent",
                    } as React.CSSProperties}
                  >
                    <Link href={item.path} className="flex items-center gap-3 w-full h-full">
                      <item.icon className={cn("h-5 w-5 shrink-0", item.color, isActive && "text-blue-600")} />
                      {state === "expanded" && (
                        <span className="text-[12px] font-black uppercase tracking-tight">
                          {t(item.name)}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter 
        className="border-t border-slate-100 p-2 mt-auto"
        style={{ backgroundColor: sidebarBg } as React.CSSProperties}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <Button 
              variant="ghost" 
              onClick={handleLogout} 
              className={cn(
                "h-11 w-full rounded-xl transition-all duration-200 group/logout justify-start px-3 gap-3",
                "hover:bg-red-600 hover:text-white text-red-600"
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="text-[12px] font-black uppercase tracking-tight truncate group-data-[collapsible=icon]:hidden">
                Logout
              </span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
