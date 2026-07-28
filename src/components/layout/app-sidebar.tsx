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
  ShieldCheck, 
  LogOut, 
  Target, 
  LifeBuoy, 
  Receipt, 
  Building2, 
  Truck as DispatchIcon,
  Database,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Layers3,
  Tag,
  Hash
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
import { cn } from "@/lib/utils"

const MODULES = [
  { name: "dashboard", key: "dashboard", icon: LayoutDashboard, path: "/" },
  { name: "sales", key: "sales", icon: ShoppingCart, path: "/sales" },
  { name: "quotations", key: "quotations", icon: FileText, path: "/quotations" },
  { name: "dispatch", key: "dispatch", icon: DispatchIcon, path: "/challans" },
  { name: "purchases", key: "purchases", icon: Package, path: "/purchases" },
  { name: "returns", key: "returns", icon: RotateCcw, path: "/returns" },
  { name: "inventory", key: "inventory", icon: Boxes, path: "/inventory" },
  { name: "serialTracking", key: "serialTracking", icon: Scan, path: "/serial-inventory" },
  { name: "projectAndBilling", key: "project-billing", icon: ClipboardList, path: "/projects" },
  { name: "contracts", key: "contracts", icon: Wrench, path: "/contracts" },
  { name: "customers", key: "customers", icon: Users, path: "/customers" },
  { name: "suppliers", key: "suppliers", icon: Truck, path: "/suppliers" },
  { name: "accounts", key: "accounts", icon: Wallet, path: "/accounts" },
  { name: "expenses", key: "expenses", icon: Receipt, path: "/expenses" },
  { name: "support", key: "support", icon: LifeBuoy, path: "/support" },
  { name: "crm", key: "crm", icon: Target, path: "/crm" },
  { name: "hrm", key: "hrm", icon: UserRoundCog, path: "/hrm" },
  { name: "branches", key: "branches", icon: Building2, path: "/branches" },
  { name: "reports", key: "reports", icon: BarChart3, path: "/reports" },
  { name: "ai", key: "ai", icon: TrendingUp, path: "/ai-forecasting" },
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

  const allowedModules = MODULES.filter(m => can(m.key, 'view'))

  return (
    <Sidebar collapsible="icon" className="border-r shadow-none bg-[#111827]">
      <SidebarHeader className="h-[60px] flex items-center px-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
            {settings?.companyLogo ? <img src={settings.companyLogo} className="w-full h-full object-contain" /> : "W"}
          </div>
          {state === "expanded" && (
            <div className="flex flex-col leading-none">
              <span className="font-bold text-white text-sm tracking-tight">Warrior ERP</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Enterprise</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-4 custom-scrollbar">
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {allowedModules.map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))} 
                  tooltip={t(item.name as any)} 
                  className={cn(
                    "h-10 px-4 transition-all hover:bg-white/5",
                    (pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))) ? "bg-primary text-white hover:bg-primary" : "text-slate-400"
                  )}
                >
                  <Link href={item.path} className="flex items-center gap-3">
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="text-[13px] font-medium">{t(item.name as any)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t('settings')} isActive={pathname.startsWith('/settings')} className="text-slate-400 hover:bg-white/5 h-10 px-4">
              <Link href="/settings" className="flex items-center gap-3">
                <Settings className="h-[18px] w-[18px]" />
                <span className="text-[13px] font-medium">{t('settings')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-10 px-4">
              <LogOut className="h-[18px] w-[18px]" />
              <span className="text-[13px] font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}