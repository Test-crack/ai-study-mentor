import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"

import { cn } from "@/shared/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-3 p-4 sm:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border p-4 shadow-2xl transition-all duration-300 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full data-[state=open]:zoom-in-95 backdrop-blur-xl",
  {
    variants: {
      variant: {
        default: "border-slate-200/50 bg-white/95 text-slate-900 shadow-slate-200/50",
        success: "border-emerald-200/50 bg-gradient-to-r from-emerald-50/95 to-teal-50/95 text-emerald-900 shadow-emerald-200/30",
        destructive: "border-rose-200/50 bg-gradient-to-r from-rose-50/95 to-red-50/95 text-rose-900 shadow-rose-200/30",
        warning: "border-amber-200/50 bg-gradient-to-r from-amber-50/95 to-yellow-50/95 text-amber-900 shadow-amber-200/30",
        info: "border-blue-200/50 bg-gradient-to-r from-blue-50/95 to-brand-teal-50/95 text-blue-900 shadow-blue-200/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const iconMap = {
  default: null,
  success: CheckCircle2,
  destructive: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const iconColorMap = {
  default: "text-slate-500",
  success: "text-emerald-500",
  destructive: "text-rose-500",
  warning: "text-amber-500",
  info: "text-blue-500",
}

const progressColorMap = {
  default: "bg-slate-400",
  success: "bg-emerald-400",
  destructive: "bg-rose-400",
  warning: "bg-amber-400",
  info: "bg-blue-400",
}

interface ToastContextValue {
  variant?: "default" | "success" | "destructive" | "warning" | "info"
}

const ToastContext = React.createContext<ToastContextValue>({ variant: "default" })

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants> & {
      showProgress?: boolean
      duration?: number
    }
>(({ className, variant = "default", showProgress = true, duration = 5000, children, ...props }, ref) => {
  const [progress, setProgress] = React.useState(100)
  
  React.useEffect(() => {
    if (!showProgress || !props.open) return
    
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining === 0) clearInterval(interval)
    }, 50)
    
    return () => clearInterval(interval)
  }, [showProgress, duration, props.open])

  return (
    <ToastContext.Provider value={{ variant: variant || "default" }}>
      <ToastPrimitives.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        duration={duration}
        {...props}
      >
        {children}
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl bg-black/5">
            <div
              className={cn(
                "h-full transition-all duration-100 ease-linear rounded-full",
                progressColorMap[variant || "default"]
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </ToastPrimitives.Root>
    </ToastContext.Provider>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/50 bg-white/80 px-3 text-xs font-semibold ring-offset-background transition-all hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-all hover:bg-black/5 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 active:scale-95",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastIcon = () => {
  const { variant } = React.useContext(ToastContext)
  const Icon = iconMap[variant || "default"]
  if (!Icon) return null
  
  return (
    <div className={cn(
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
      variant === "success" && "bg-emerald-100/80",
      variant === "destructive" && "bg-rose-100/80",
      variant === "warning" && "bg-amber-100/80",
      variant === "info" && "bg-blue-100/80"
    )}>
      <Icon className={cn("h-5 w-5", iconColorMap[variant || "default"])} />
    </div>
  )
}

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-bold leading-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-80 leading-relaxed", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
}
