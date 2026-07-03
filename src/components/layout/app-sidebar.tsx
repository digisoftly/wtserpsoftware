
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
  Settings, 
  ShieldCheck, 
  LogOut, 
  Target, 
  LifeBuoy, 
  Receipt, 
  Building2, 
  Truck as DispatchIcon,
  Database,
  ChevronDown,
  ChevronRight
} from "lucide-react"

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, useSidebar } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { usePermissions } from "@/hooks/use-permissions"
import { useSettings } from "@/hooks/use-settings"
import { useTranslation } from "@/hooks/use-translation"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const MASTER_MODULES = [
  { name: "units", key: "units", path: "/master/units" },
  { name: "categories", key: "categories", path: "/master/categories" },
  { name: "brands", key: "brands", path: "/master/brands" },
  { name: "models", key: "models", path: "/master/models" },
  { name: "productTypes", key: "productTypes", path: "/master/product-types" },
  { name: "serviceTypes", key: "serviceTypes", path: "/master/service-types" },
  { name: "customFields", key: "customFields", path: "/master/custom-fields" },
]

const MODULES = [
  { name: "dashboard", key: "dashboard", icon: LayoutDashboard, color: "text-blue-500", path: "/" },
  { name: "sales", key: "sales", icon: ShoppingCart, color: "text-green-500", path: "/sales" },
  { name: "quotations", key: "quotations", icon: FileText, color: "text-purple-500", path: "/quotations" },
  { name: "dispatch", key: "dispatch", icon: DispatchIcon, color: "text-amber-500", path: "/challans" },
  { name: "purchases", key: "purchases", icon: Package, color: "text-orange-500", path: "/purchases" },
  { name: "returns", key: "returns", icon: RotateCcw, color: "text-red-500", path: "/returns" },
  { name: "inventory", key: "inventory", icon: Boxes, color: "text-yellow-600", path: "/inventory" },
  { name: "masterManagement", key: "masterManagement", icon: Database, color: "text-pink-500", path: "/master/units" },
  { name: "serialTracking", key: "serialTracking", icon: Scan, color: "text-blue-400", path: "/serial-inventory" },
  { name: "projects", key: "projects", icon: Folder, color: "text-teal-500", path: "/projects" },
  { name: "billing", key: "project-billing", icon: Layers, color: "text-violet-500", path: "/project-billing" },
  { name: "contracts", key: "contracts", icon: Wrench, color: "text-emerald-500", path: "/contracts" },
  { name: "customers", key: "customers", icon: Users, color: "text-cyan-500", path: "/customers" },
  { name: "suppliers", key: "suppliers", icon: Truck, color: "text-amber-700", path: "/suppliers" },
  { name: "accounts", key: "accounts", icon: Wallet, color: "text-blue-600", path: "/accounts" },
  { name: "expenses", key: "expenses", icon: Receipt, color: "text-red-400", path: "/expenses" },
  { name: "support", key: "support", icon: LifeBuoy, color: "text-indigo-500", path: "/support" },
  { name: "crm", key: "crm", icon: Target, color: "text-rose-500", path: "/crm" },
  { name: "hrm", key: "hrm", icon: UserRoundCog, color: "text-purple-500", path: "/hrm" },
  { name: "branches", key: "branches", icon: Building2, color: "text-blue-600", path: "/branches" },
  { name: "reports", key: "reports", icon: BarChart3, color: "text-indigo-400", path: "/reports" },
  { name: "ai", key: "ai", icon: TrendingUp, color: "text-violet-500", path: "/ai-forecasting" },
  { name: "settings", key: "settings", icon: Settings, color: "text-rose-500", path: "/settings" },
  { name: "users", key: "users", icon: ShieldCheck, color: "text-violet-600", path: "/users" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const auth = useAuth()
  const router = useRouter()
  const { can } = usePermissions()
  const { settings } = useSettings()
  const { t } = useTranslation()
  const [masterOpen, setMasterOpen] = React.useState(pathname.startsWith('/master'))

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const order = settings?.sidebarMenuOrder || MODULES.map(m => m.key);
  const sortedModules = [...MODULES].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  const allowedModules = sortedModules.filter(m => can(m.key, 'view'))

  return (
    <Sidebar collapsible="icon" className="border-r shadow-none bg-[#0A0F1E]">
      <SidebarHeader className="h-14 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#3B82F6] flex items-center justify-center text-white font-bold text-sm shadow-lg overflow-hidden">
            {settings?.companyLogo ? <img src={settings.companyLogo} className="w-full h-full object-contain" /> : "W"}
          </div>
          {state === "expanded" && <span className="font-bold text-white font-headline text-sm">Warrior ERP</span>}
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarMenu>
            {allowedModules.map((item) => {
              if (item.key === 'masterManagement') {
                return (
                  <Collapsible key={item.key} open={masterOpen} onOpenChange={setMasterOpen}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={t('masterManagement')} className="hover:bg-white/5 h-10 px-4">
                          <Database className="text-pink-500 h-4 w-4 shrink-0" />
                          <span className="text-[13px] font-medium text-white/70">{t('masterManagement')}</span>
                          {state === "expanded" && (
                            masterOpen ? <ChevronDown className="ml-auto h-3 w-3" /> : <ChevronRight className="ml-auto h-3 w-3" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenu className="ml-4 border-l border-white/5 pl-2 mt-1 space-y-1">
                          {MASTER_MODULES.map((sub) => (
                            <SidebarMenuItem key={sub.key}>
                              <SidebarMenuButton asChild isActive={pathname === sub.path} className="h-8 px-4 hover:bg-white/5 rounded-md">
                                <Link href={sub.path} className="text-[11px] font-medium text-white/50 group-data-[active=true]:text-pink-400">
                                  {t(sub.name as any)}
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
                  <SidebarMenuButton asChild isActive={pathname === item.path} tooltip={t(item.name as any)} className="hover:bg-white/5 active:bg-blue-600/10 h-10 px-4">
                    <Link href={item.path} className="flex items-center gap-3">
                      <item.icon className={`${item.color} h-4 w-4 shrink-0`} />
                      <span className="text-[13px] font-medium text-white/70 group-data-[active=true]:text-white">{t(item.name as any)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/5 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-red-400 hover:bg-red-400/10 h-10 px-4">
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="text-[13px] font-bold">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
