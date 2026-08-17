
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
  UserRoundCog, 
  BarChart3, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Target, 
  LifeBuoy, 
  Receipt, 
  Building2, 
  Database,
  ClipboardList,
  ChevronRight,
  CreditCard,
  ShieldAlert,
  History,
  Lock
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
  { name: "nav.dashboard", key: "dashboard", icon: LayoutDashboard, path: "/", color: "text-blue-500" },
  { name: "nav.sales", key: "sales", icon: ShoppingCart, path: "/sales", color: "text-green-500" },
  { name: "common.amount", key: "payments", icon: CreditCard, path: "/payments", color: "text-emerald-500" },
  { name: "nav.quotations", key: "quotations", icon: FileText, path: "/quotations", color: "text-amber-500" },
  { name: "nav.dispatch", key: "dispatch", icon: Truck, path: "/challans", color: "text-cyan-500" },
  { name: "nav.purchases", key: "purchases", icon: Package, path: "/purchases", color: "text-emerald-500" },
  { name: "nav.returns", key: "returns", icon: RotateCcw, path: "/returns", color: "text-red-500" },
  { name: "nav.inventory", key: "inventory", icon: Boxes, path: "/inventory", color: "text-sky-500" },
  { name: "nav.serialTracking", key: "serialTracking", icon: Scan, path: "/serial-inventory", color: "text-purple-500" },
  { name: "nav.projectBilling", key: "project-billing", icon: ClipboardList, path: "/projects", color: "text-teal-500" },
  { name: "nav.contracts", key: "contracts", icon: Wrench, path: "/contracts", color: "text-indigo-500" },
  { name: "nav.customers", key: "customers", icon: Users, path: "/customers", color: "text-blue-400" },
  { name: "nav.suppliers", key: "suppliers", icon: Truck, path: "/suppliers", color: "text-rose-500" },
  { name: "nav.accounts", key: "accounts", icon: Wallet, path: "/accounts", color: "text-yellow-500" },
  { name: "nav.expenses", key: "expenses", icon: Receipt, path: "/expenses", color: "text-orange-500" },
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

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-[#111827]">
      <SidebarHeader className="h-[58px] flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
            {settings?.companyLogo ? <img src={settings.companyLogo} className="w-full h-full object-contain" /> : "W"}
          </div>
          {state === "expanded" && (
            <span className="font-bold text-white text-[13px] tracking-tight truncate">Warrior ERP</span>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-2 custom-scrollbar">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-0.5 px-2">
            {MAIN_MODULES.filter(m => can(m.key, 'view')).map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))} 
                  tooltip={t(item.name)} 
                  className={cn(
                    "h-8 px-2.5 transition-all hover:bg-white/5",
                    (pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))) ? "bg-primary text-white hover:bg-primary" : "text-slate-400"
                  )}
                >
                  <Link href={item.path} className="flex items-center gap-3">
                    <item.icon className={cn("h-4 w-4 shrink-0", (pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))) ? "text-white" : item.color)} />
                    <span className="text-[12px] font-medium">{t(item.name)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {can('masterManagement', 'view') && (
              <Collapsible defaultOpen={isMasterActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      isActive={isMasterActive}
                      tooltip={t('nav.master')}
                      className={cn(
                        "h-8 px-2.5 transition-all hover:bg-white/5",
                        isMasterActive ? "bg-primary/10 text-primary" : "text-slate-400"
                      )}
                    >
                      <Database className={cn("h-4 w-4 shrink-0", isMasterActive ? "text-primary" : "text-orange-500")} />
                      <span className="text-[12px] font-medium">{t('nav.master')}</span>
                      <ChevronRight className="ml-auto h-3 w-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu className="mt-0.5 ml-3 border-l border-white/5 gap-0.5">
                      {MASTER_DATA_ITEMS.map((sub) => (
                        <SidebarMenuItem key={sub.path}>
                          <SidebarMenuButton 
                            asChild 
                            isActive={pathname === sub.path}
                            className={cn(
                              "h-7 px-4 text-slate-400 hover:text-white hover:bg-white/5",
                              pathname === sub.path && "text-white bg-white/5 font-bold"
                            )}
                          >
                            <Link href={sub.path}>
                              <span className="text-[11px]">{t(`nav.${sub.name}`)}</span>
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

      <SidebarFooter className="border-t border-white/5 p-2">
        <SidebarMenu className="px-2">
          {can('settings', 'view') && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('nav.settings')} isActive={pathname.startsWith('/settings')} className="text-slate-400 hover:bg-white/5 h-8 px-2.5">
                <Link href="/settings" className="flex items-center gap-3">
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span className="text-[12px] font-medium">{t('nav.settings')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 px-2.5">
              <LogOut className="h-4 w-4 text-red-500" />
              <span className="text-[12px] font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
