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
  BrainCircuit,
  ShieldAlert,
  Clock,
  Heart,
  CreditCard,
  UserPlus,
  Award,
  GraduationCap,
  HardDrive,
  MessageSquare,
  DoorOpen,
  FileBarChart
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
  support: { name: "support", key: "support", icon: GitPullRequest, path: "/support", color: "text-indigo-500" },
  crm: { name: "crm", key: "crm", icon: Target, path: "/crm", color: "text-rose-700" },
  branches: { name: "branches", key: "branches", icon: Building2, path: "/branches", color: "text-slate-700" },
  reports: { name: "reports", key: "reports", icon: BarChart3, path: "/reports", color: "text-blue-700" },
  ai: { name: "ai", key: "ai", icon: BrainCircuit, path: "/ai-forecasting", color: "text-violet-700" },
  users: { name: "users", key: "users", icon: UserRoundCog, path: "/users", color: "text-violet-600" },
  settings: { name: "settings", key: "settings", icon: Settings, path: "/settings", color: "text-slate-600" },
};

const HRM_SUB_MENUS = [
  { name: "hrm_dashboard", path: "/hrm", icon: LayoutDashboard },
  { 
    name: "employee_management", 
    icon: Users,
    items: [
      { name: "employees", path: "/hrm/employees" },
      { name: "departments", path: "/hrm/departments" },
      { name: "designations", path: "/hrm/designations" },
      { name: "branches", path: "/branches" },
    ]
  },
  {
    name: "attendance_management",
    icon: Clock,
    items: [
      { name: "dailyAttendance", path: "/hrm/attendance" },
      { name: "attendanceHistory", path: "/hrm/attendance/history" },
      { name: "shifts", path: "/hrm/shifts" },
      { name: "holidays", path: "/hrm/holidays" },
    ]
  },
  {
    name: "leave_management",
    icon: Heart,
    items: [
      { name: "leaveRequests", path: "/hrm/leave" },
      { name: "leaveBalance", path: "/hrm/leave/balance" },
    ]
  },
  {
    name: "payroll_salary",
    icon: CreditCard,
    items: [
      { name: "monthlyPayroll", path: "/hrm/payroll" },
      { name: "salaryStructure", path: "/hrm/payroll/structure" },
      { name: "salaryAdvances", path: "/hrm/payroll/advances" },
    ]
  },
  {
    name: "recruitment",
    icon: UserPlus,
    items: [
      { name: "jobPositions", path: "/hrm/recruitment/jobs" },
      { name: "candidates", path: "/hrm/recruitment/candidates" },
    ]
  },
  {
    name: "performance_management",
    icon: Award,
    items: [
      { name: "performanceReviews", path: "/hrm/performance" },
      { name: "goals_kpi", path: "/hrm/performance/goals" },
    ]
  },
  { name: "hrm_reports", path: "/hrm/reports", icon: FileBarChart }
];

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
  const sidebarHover = settings?.sidebarHoverColor || "#E5E7EB" 
  const sidebarActive = settings?.sidebarActiveColor || "#E5E7EB"

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const isHrmActive = pathname.startsWith('/hrm')
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
              if (key === 'hrm') return null; // Handle HRM separately below
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
                      "h-11 px-3 transition-all rounded-xl group relative overflow-hidden",
                      isActive 
                        ? "font-bold" 
                        : "hover:bg-slate-200"
                    )}
                    style={{ 
                      color: isActive ? "#000000" : sidebarText,
                      backgroundColor: isActive ? sidebarActive : "transparent",
                    } as React.CSSProperties}
                  >
                    <Link 
                      href={item.path} 
                      className="flex items-center gap-3 w-full h-full"
                    >
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0 transition-colors", 
                        item.color,
                        isActive && "text-blue-600"
                      )} />
                      {state === "expanded" && (
                        <span className="text-[12px] font-black uppercase tracking-tight">
                          {t(item.name)}
                        </span>
                      )}
                      {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

            {/* EXPANDABLE HRM MENU */}
            {can('hrm', 'view') && (
              <Collapsible defaultOpen={isHrmActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      isActive={isHrmActive}
                      tooltip={t('hrm')}
                      className={cn(
                        "h-11 px-3 transition-all rounded-xl group",
                        isHrmActive ? "font-bold" : "hover:bg-slate-200"
                      )}
                      style={{ 
                        color: isHrmActive ? "#000000" : sidebarText,
                        backgroundColor: isHrmActive ? sidebarActive : "transparent",
                      } as React.CSSProperties}
                    >
                      <div className="flex items-center gap-3 w-full h-full rounded-xl">
                        <Briefcase className={cn(
                          "h-5 w-5 shrink-0 transition-colors", 
                          "text-purple-600",
                          isHrmActive && "text-purple-700"
                        )} />
                        {state === "expanded" && (
                          <>
                            <span className="text-[12px] font-black uppercase tracking-tight">{t('hrm')}</span>
                            <ChevronRight className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </>
                        )}
                        {isHrmActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-purple-600 rounded-r-full" />}
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="mt-1 ml-4 border-l border-slate-100 gap-0.5">
                      {HRM_SUB_MENUS.map((sub) => {
                        if (sub.items) {
                          return (
                            <Collapsible key={sub.name} className="group/sub">
                              <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton className="h-9 px-4 hover:bg-slate-100 rounded-lg text-slate-600 font-bold uppercase text-[10px]">
                                    <sub.icon className="h-3.5 w-3.5 mr-2 opacity-70" />
                                    {t(sub.name)}
                                    <ChevronRight className="ml-auto h-2.5 w-2.5 transition-transform duration-200 group-data-[state=open]/sub:rotate-90" />
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenu className="ml-4 border-l border-slate-100">
                                    {sub.items.map(item => (
                                      <SidebarMenuItem key={item.path}>
                                        <SidebarMenuButton asChild isActive={pathname === item.path} className="h-8 px-4 rounded-lg">
                                          <Link href={item.path}>
                                            <span className="text-[9px] uppercase font-black">{t(item.name)}</span>
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
                          <SidebarMenuItem key={sub.path}>
                            <SidebarMenuButton asChild isActive={pathname === sub.path} className="h-9 px-4 rounded-lg">
                              <Link href={sub.path!}>
                                <sub.icon className="h-3.5 w-3.5 mr-2 opacity-70" />
                                <span className="text-[10px] uppercase font-black">{t(sub.name)}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )}

            {can('masterManagement', 'view') && (
              <Collapsible defaultOpen={isMasterActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      isActive={isMasterActive}
                      tooltip={t('master')}
                      className={cn(
                        "h-11 px-3 transition-all rounded-xl group",
                        isMasterActive ? "font-bold" : "hover:bg-slate-200"
                      )}
                      style={{ 
                        color: isMasterActive ? "#000000" : sidebarText,
                        backgroundColor: isMasterActive ? sidebarActive : "transparent",
                      } as React.CSSProperties}
                    >
                      <div className="flex items-center gap-3 w-full h-full rounded-xl">
                        <Database className={cn(
                          "h-5 w-5 shrink-0 transition-colors", 
                          "text-orange-500",
                          isMasterActive && "text-orange-600"
                        )} />
                        {state === "expanded" && (
                          <>
                            <span className="text-[12px] font-black uppercase tracking-tight">{t('master')}</span>
                            <ChevronRight className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </>
                        )}
                        {isMasterActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-orange-600 rounded-r-full" />}
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
                                ? "text-blue-600 font-black" 
                                : "hover:bg-slate-200"
                            )}
                            style={{ 
                              color: pathname === sub.path ? "blue" : sidebarText,
                              backgroundColor: pathname === sub.path ? sidebarActive : "transparent",
                            } as React.CSSProperties}
                          >
                            <Link href={sub.path}>
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
        className="border-t border-slate-100 p-2 mt-auto"
        style={{ backgroundColor: sidebarBg } as React.CSSProperties}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              tooltip="Logout"
              className={cn(
                "h-11 w-full rounded-xl transition-all duration-200 group/logout",
                "hover:bg-red-600 hover:text-white"
              )}
              style={{ color: sidebarText } as React.CSSProperties}
            >
              <LogOut className="h-5 w-5 text-red-500 group-hover/logout:text-white transition-colors shrink-0" />
              <span className="text-[12px] font-black uppercase tracking-tight truncate group-data-[collapsible=icon]:hidden">
                Logout
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
