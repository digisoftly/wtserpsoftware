
"use client"

import * as React from "react"
import { Search, ChevronDown, Building, Loader2, User, LogOut, Languages, Bell, Settings2 } from "lucide-react"

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
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function AppHeader() {
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { companyId, branchId, setBranchId, language, setLanguage, userRole, settings } = useTenant()
  const router = useRouter()
  const { t } = useTranslation()

  const branchesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "branches"), orderBy("branchName"));
  }, [db, companyId]);
  const { data: branches, isLoading: branchesLoading } = useCollection(branchesQuery);

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const activeBranch = branches?.find(b => b.id === branchId) || { branchName: 'Main Terminal' };

  return (
    <header className="h-[64px] border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-[45] shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="h-9 w-9 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" />
        <div className="hidden lg:flex items-center gap-2 px-4 h-10 bg-slate-50 rounded-2xl w-full max-w-[320px] border border-slate-100 focus-within:bg-white focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50 transition-all group">
          <Search className="h-4 w-4 text-slate-300 group-focus-within:text-blue-500" />
          <input 
            placeholder={t('search')} 
            className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-400 font-bold" 
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-4">
        {/* Branch Switcher (Admin Only) */}
        {userRole?.isSuperAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-2 rounded-xl px-3 text-[11px] font-black text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all border border-transparent hover:border-slate-100">
                <Building className="h-4 w-4 text-blue-500" /> 
                <span className="hidden sm:inline uppercase tracking-tight">{activeBranch.branchName}</span>
                <ChevronDown className="h-3 w-3 opacity-30" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl shadow-2xl border-slate-100 p-2 animate-in fade-in zoom-in-95">
              <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400 px-2 py-2 mb-1 tracking-widest">Switch Location</DropdownMenuLabel>
              {branchesLoading ? (
                <div className="p-4 text-center"><Loader2 className="animate-spin h-4 w-4 mx-auto text-blue-200" /></div>
              ) : (
                <div className="space-y-1">
                  {branches?.map(b => (
                    <DropdownMenuItem 
                      key={b.id} 
                      onClick={() => setBranchId(b.id)} 
                      className={cn(
                        "cursor-pointer text-xs py-2.5 rounded-xl px-3 font-bold transition-all",
                        branchId === b.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                      )}
                    >
                      <Building className={cn("mr-2 h-3.5 w-3.5", branchId === b.id ? "text-blue-600" : "text-slate-300")} />
                      {b.branchName}
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Language Switcher - Redesigned & Fixed */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 px-4 rounded-full border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all gap-2 shadow-sm active:scale-95 group"
          onClick={() => {
            const nextLang = language === 'EN' ? 'BN' : 'EN';
            setLanguage(nextLang);
          }}
        >
          <Languages className="h-4 w-4 text-blue-500 group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            {language === 'EN' ? 'বাংলা' : 'English'}
          </span>
        </Button>

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-slate-50 hover:text-blue-600 rounded-full relative transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </Button>

        <div className="w-px h-6 bg-slate-100 mx-1 hidden md:block" />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0.5 h-10 hover:bg-slate-50 rounded-full flex items-center gap-2 pr-2 transition-all outline-none border border-transparent hover:border-slate-100">
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} />
                <AvatarFallback className="text-[10px] font-black bg-blue-100 text-blue-600 uppercase">
                  {user?.email?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 text-slate-300 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 mt-2 shadow-2xl border-slate-100 p-2 rounded-[1.5rem] animate-in fade-in zoom-in-95">
            <div className="px-3 py-4 bg-slate-50 rounded-2xl mb-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Signed In As</p>
              <p className="text-xs font-black text-slate-900 truncate uppercase">{user?.email}</p>
              <Badge variant="outline" className="mt-2 text-[8px] h-4 font-black uppercase bg-white border-none shadow-sm text-blue-600">
                {userRole?.name || "Terminal User"}
              </Badge>
            </div>
            <DropdownMenuSeparator className="bg-slate-100" />
            <div className="py-1">
              <DropdownMenuItem onClick={() => router.push('/profile')} className="py-2.5 px-3 cursor-pointer text-xs font-bold rounded-xl transition-all hover:bg-slate-50">
                <User className="mr-3 h-4 w-4 text-slate-400" /> {t('profile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="py-2.5 px-3 cursor-pointer text-xs font-bold rounded-xl transition-all hover:bg-slate-50">
                <Settings2 className="mr-3 h-4 w-4 text-slate-400" /> Organization
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem 
              className="py-3 px-3 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer text-xs font-black uppercase tracking-widest rounded-xl transition-all mt-1" 
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
