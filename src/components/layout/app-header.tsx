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
    <header className="h-[60px] border-b bg-white flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="h-9 w-9 text-slate-500" />
        <div className="hidden md:flex items-center gap-2 px-3 h-9 bg-slate-50 rounded-md w-full max-w-sm border border-slate-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <Search className="h-4 w-4 text-slate-400" />
          <input 
            placeholder={t('search')} 
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400" 
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {userRole?.isSuperAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-2 rounded-md px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                <Building className="h-4 w-4" /> 
                <span className="hidden sm:inline">{activeBranch.name}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400 px-3 py-2">Select Branch</DropdownMenuLabel>
              {branchesLoading ? (
                <div className="p-4 text-center"><Loader2 className="animate-spin h-4 w-4 mx-auto text-slate-400" /></div>
              ) : (
                branches?.map(b => (
                  <DropdownMenuItem key={b.id} onClick={() => setBranchId(b.id)} className="cursor-pointer">
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
          className="h-9 w-9 text-slate-500 hover:bg-slate-50"
          onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
          title={language === 'EN' ? 'বাংলা' : 'English'}
        >
          <Languages className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:bg-slate-50">
          <Bell className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-200 mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 h-9 hover:bg-transparent flex items-center gap-2 pr-2 outline-none group">
              <Avatar className="h-8 w-8 border border-slate-200">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} />
                <AvatarFallback className="text-[10px] font-bold bg-primary text-white">AD</AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start leading-none">
                <span className="text-xs font-bold text-slate-700">{settings?.companyName || "Warrior ERP"}</span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase font-semibold tracking-tighter">{userRole?.name}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-primary transition-colors" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 shadow-xl border-slate-100">
            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">{t('identity')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="py-2 cursor-pointer">
              <User className="mr-2 h-4 w-4 text-slate-400" /> {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')} className="py-2 cursor-pointer">
              <Building className="mr-2 h-4 w-4 text-slate-400" /> Organization
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-2 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}