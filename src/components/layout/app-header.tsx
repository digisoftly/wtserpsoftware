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
  Menu
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

export function AppHeader() {
  const { isMobile } = useSidebar()
  const [lang, setLang] = React.useState<'EN' | 'BN'>('EN')

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border border-input focus-within:ring-2 focus-within:ring-primary w-full max-w-md transition-all">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input 
            placeholder="Search module or data..." 
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Quick Add Floating Button Replacement for Desktop */}
        <Button size="sm" className="hidden md:flex items-center gap-2 rounded-full px-4 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
          <Plus className="h-4 w-4" />
          <span>Quick Entry</span>
        </Button>

        {/* Branch Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden lg:flex gap-2 rounded-full border-primary/20 hover:bg-primary/5">
              <Building className="h-4 w-4 text-primary" />
              <span>Dhaka Branch</span>
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

        {/* Language Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => setLang(l => l === 'EN' ? 'BN' : 'EN')}
        >
          <Languages className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Toggle Language</span>
          <Badge variant="outline" className="absolute -top-1 -right-1 text-[8px] h-4 w-6 p-0 flex items-center justify-center bg-white">
            {lang}
          </Badge>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 hover:bg-transparent flex items-center gap-2 outline-none group">
              <Avatar className="h-9 w-9 border-2 border-primary/10 group-hover:border-primary/30 transition-all">
                <AvatarImage src="https://picsum.photos/seed/user1/200/200" />
                <AvatarFallback>AD</AvatarFallback>
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
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Company Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}