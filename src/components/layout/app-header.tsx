"use client"

import * as React from "react"
import { Search, ChevronDown, Building, Loader2, User, LogOut, Languages, Bell } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useTenant } from "@/context/tenant-context"
import { collection, query, orderBy } from "firebase/firestore"
import { useTranslation } from "@/hooks/use-translation"

export function AppHeader() {
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { companyId, branchId, setBranchId, language, setLanguage, userRole, settings } = useTenant()
  const router = useRouter()
  const { t } = useTranslation()

  const branchesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "branches"), orderBy("name"));
  }, [db, companyId]);
  const { data: branches, isLoading: branchesLoading } = useCollection(branchesQuery);

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const activeBranch = branches?.find(b => b.id === branchId) || { name: 'Main' };

  return (
    <header className="h-[58px] border-b bg-white flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="h-8 w-8 text-slate-400 hover:text-slate-600" />
        <div className="hidden md:flex items-center gap-2 px-3 h-8 bg-slate-50 rounded-md w-full max-w-[300px] border border-slate-100 focus-within:bg-white focus-within:border-primary/30 transition-all">
          <Search className="h-3.5 w-3.5 text-slate-300" />
          <input 
            placeholder={t('search')} 
            className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-300" 
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {userRole?.isSuperAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-md px-2.5 text-[11px] font-bold text-slate-500">
                <Building className="h-3.5 w-3.5" /> 
                <span className="hidden sm:inline">{activeBranch.name}</span>
                <ChevronDown className="h-3 w-3 opacity-30" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 mt-1 rounded-md shadow-xl border-slate-100 p-1">
              <DropdownMenuLabel className="text-[9px] uppercase font-bold text-slate-400 px-2 py-1.5">Location</DropdownMenuLabel>
              {branchesLoading ? (
                <div className="p-3 text-center"><Loader2 className="animate-spin h-3 w-3 mx-auto text-slate-300" /></div>
              ) : (
                branches?.map(b => (
                  <DropdownMenuItem key={b.id} onClick={() => setBranchId(b.id)} className="cursor-pointer text-xs py-2">
                    <span className={branchId === b.id ? "font-bold text-primary" : ""}>{b.name}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-400 hover:bg-slate-50"
          onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
        >
          <Languages className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-50">
          <Bell className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-slate-100 mx-1.5" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 h-8 hover:bg-transparent flex items-center gap-2 pr-1 outline-none">
              <Avatar className="h-7 w-7 border border-slate-100">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} />
                <AvatarFallback className="text-[9px] font-bold bg-slate-100 text-slate-500">AD</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 text-slate-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 mt-1 shadow-2xl border-slate-100 p-1 rounded-md">
            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5">{settings?.companyName || "Warrior ERP"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="py-2 cursor-pointer text-xs font-medium">
              <User className="mr-2 h-3.5 w-3.5 text-slate-400" /> {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')} className="py-2 cursor-pointer text-xs font-medium">
              <Building className="mr-2 h-3.5 w-3.5 text-slate-400" /> Organization
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-2 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer text-xs font-medium" onClick={handleLogout}>
              <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
