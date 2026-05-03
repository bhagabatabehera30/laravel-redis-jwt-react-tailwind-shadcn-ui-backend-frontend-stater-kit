import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoaderProps {
  isLoading: boolean
  message?: string
  fullScreen?: boolean
  className?: string
}

export function Loader({ 
  isLoading, 
  message = "Loading...", 
  fullScreen = false,
  className 
}: LoaderProps) {
  if (!isLoading) return null

  return (
    <div 
      className={cn(
        "z-[99999] flex flex-col items-center justify-center gap-4 bg-background/60 backdrop-blur-md transition-all animate-in fade-in duration-300",
        fullScreen ? "fixed inset-0" : "absolute inset-0 rounded-lg",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulse effect */}
        <div className="absolute inset-0 h-16 w-16 -translate-x-3 -translate-y-3 rounded-full bg-primary/20 blur-xl animate-pulse" />
        
        {/* Core spinning ring */}
        <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
      </div>
      
      {/* Loading message */}
      {message && (
        <p className="text-sm font-medium tracking-wide text-foreground/80 animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}
