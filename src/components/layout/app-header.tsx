"use client"

import * as React from "react"
import { Search, ChevronDown, Building, Loader2, User, LogOut, Languages } from "lucide-react"

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
  const { companyId, branchId, setBranchId, language, setLanguage, userRole } = useTenant()
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
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        <div className="hidden md:flex items-center gap-2 px-3 h-8 bg-muted/50 rounded-full w-full max-w-xs border border-transparent focus-within:border-blue-500/50 transition-all">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input placeholder={t('search')} className="bg-transparent border-none outline-none text-xs w-full" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {userRole?.isSuperAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-blue-50 hover:text-blue-600">
                <Building className="h-3.5 w-3.5" /> {activeBranch.name} <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {branchesLoading ? (
                <div className="p-4 text-center"><Loader2 className="animate-spin h-4 w-4 mx-auto" /></div>
              ) : (
                branches?.map(b => (
                  <DropdownMenuItem key={b.id} onClick={() => setBranchId(b.id)} className="text-xs font-medium">
                    {b.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-2 rounded-full px-4 text-[10px] font-bold uppercase transition-all hover:bg-slate-100 text-slate-600" 
          onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
        >
          <Languages className="h-3.5 w-3.5 text-blue-600" />
          {language === 'EN' ? 'বাংলা' : 'English'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 h-8 hover:bg-transparent flex items-center outline-none">
              <Avatar className="h-7 w-7 border shadow-sm">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/100/100`} />
                <AvatarFallback className="text-[10px] font-bold">AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mt-2">
            <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('identity')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="text-xs font-medium cursor-pointer">
              <User className="mr-2 h-3.5 w-3.5" /> {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-medium text-red-500 cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
