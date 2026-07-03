
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function ProjectBillingRedirect() {
  const router = useRouter()
  
  React.useEffect(() => {
    // Redirect to the unified Project & Billing module
    router.push("/projects")
  }, [router])

  return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Initializing Unified Terminal...</p>
      </div>
    </div>
  )
}
