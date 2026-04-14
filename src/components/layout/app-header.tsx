
"use client"

import * as React from "react"
import { 
  Bell, 
  Search, 
  Languages, 
  Plus, 
  Settings, 
  User, 
  LogOut,
  ChevronDown,
  Building,
  UserPlus
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTenant } from "@/context/tenant-context"
import { collection, serverTimestamp } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"

export function AppHeader() {
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { companyId, branchId, language, setLanguage } = useTenant()
  const router = useRouter()
  const [isQuickEntryOpen, setIsQuickEntryOpen] = React.useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  const handleQuickAddCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const customerData = {
      companyId,
      branchId,
      customerType: "individual",
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: (formData.get("email") as string) || "",
      phoneNumber: (formData.get("phoneNumber") as string) || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "customers");
    addDocumentNonBlocking(colRef, customerData);
    setIsQuickEntryOpen(false);
    toast({ title: "Customer Added", description: "The manual entry has been saved to your directory." });
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border border-input focus-within:ring-2 focus-within:ring-primary w-full max-w-md transition-all">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input 
            placeholder={language === 'BN' ? "মডিউল বা ডেটা খুঁজুন..." : "Search module or data..."}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button 
          size="sm" 
          onClick={() => setIsQuickEntryOpen(true)}
          className="hidden md:flex items-center gap-2 rounded-full px-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'BN' ? "কুইক এন্ট্রি" : "Quick Entry"}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden lg:flex gap-2 rounded-full border-primary/20 hover:bg-primary/5">
              <Building className="h-4 w-4 text-primary" />
              <span>{branchId === 'dhaka-main' ? 'Dhaka Branch' : branchId}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Switch Branch</DropdownMenuLabel>
            <DropdownMenuItem className="bg-primary/5">Dhaka Main</DropdownMenuItem>
            <DropdownMenuItem>Chittagong Branch</DropdownMenuItem>
            <DropdownMenuItem>Sylhet Center</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
        >
          <Languages className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Toggle Language</span>
          <Badge variant="outline" className="absolute -top-1 -right-1 text-[8px] h-4 w-6 p-0 flex items-center justify-center bg-white">
            {language}
          </Badge>
        </Button>

        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 hover:bg-transparent flex items-center gap-2 outline-none group">
              <Avatar className="h-9 w-9 border-2 border-primary/10 group-hover:border-primary/30 transition-all">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200/200`} />
                <AvatarFallback>{user?.email?.[0].toUpperCase() || "AD"}</AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start text-left leading-none">
                <span className="text-sm font-semibold">Admin User</span>
                <span className="text-[10px] text-muted-foreground uppercase">Super Admin</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden lg:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Company Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isQuickEntryOpen} onOpenChange={setIsQuickEntryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Quick Customer Entry
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickAddCustomer} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">First Name</Label>
                <Input name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Last Name</Label>
                <Input name="lastName" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email Address</Label>
              <Input name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Phone Number</Label>
              <Input name="phoneNumber" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsQuickEntryOpen(false)}>Cancel</Button>
              <Button type="submit">Save Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  )
}
