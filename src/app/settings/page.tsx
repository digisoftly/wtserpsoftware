"use client"

import * as React from "react"
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  CreditCard,
  Palette,
  Layout,
  UserCog,
  ShieldAlert
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">System Settings</h1>
          <p className="text-muted-foreground mt-1">Configure company profile, branches, and system preferences</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 rounded-full px-6">Save All Changes</Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm">
          <TabsTrigger value="profile" className="rounded-lg gap-2">
            <Building2 className="h-4 w-4" /> Company Profile
          </TabsTrigger>
          <TabsTrigger value="branches" className="rounded-lg gap-2">
            <MapPin className="h-4 w-4" /> Branch Management
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg gap-2">
            <Palette className="h-4 w-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="subscription" className="rounded-lg gap-2">
            <CreditCard className="h-4 w-4" /> Billing & Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="font-headline">Basic Information</CardTitle>
                <CardDescription>Primary details for invoices and documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" defaultValue="Warrior Tech System" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regNumber">Registration Number</Label>
                    <Input id="regNumber" defaultValue="WTS-BD-2023-9981" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Public Email</Label>
                    <Input id="email" type="email" defaultValue="support@warriortech.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue="+880 1711-000000" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Headquarters Address</Label>
                  <Input id="address" defaultValue="Level 4, Tech Plaza, Banani, Dhaka 1213" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input id="website" defaultValue="https://warriorerp.com" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle className="font-headline">Logo & Identity</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-2xl bg-primary flex items-center justify-center text-white text-6xl font-headline font-bold shadow-xl mb-4">
                    W
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full">Change Logo</Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-xl bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Quick Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bilingual Support</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Stock Sync</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Maintenance Mode</span>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subscription">
          <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent p-8 text-white">
              <h3 className="text-2xl font-headline font-bold">Premium Enterprise Plan</h3>
              <p className="opacity-80">Your subscription is active until December 31, 2024</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold">$199</span>
                <span className="opacity-80">/ month billed annually</span>
              </div>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-background rounded-xl border border-dashed text-center">
                  <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold mb-2">Branches</p>
                  <p className="text-3xl font-headline font-bold">Unlimited</p>
                </div>
                <div className="p-4 bg-background rounded-xl border border-dashed text-center">
                  <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold mb-2">User Seats</p>
                  <p className="text-3xl font-headline font-bold">50 / 100</p>
                </div>
                <div className="p-4 bg-background rounded-xl border border-dashed text-center">
                  <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold mb-2">Storage</p>
                  <p className="text-3xl font-headline font-bold">500 GB</p>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
                <Button variant="outline" className="rounded-full px-8">Manage Billing</Button>
                <Button className="bg-primary rounded-full px-8">Upgrade Features</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}