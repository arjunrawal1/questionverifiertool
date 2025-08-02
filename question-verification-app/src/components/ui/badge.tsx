import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

function Badge({ className = "", variant = "secondary", children, ...props }: BadgeProps) {
  const baseClass = "badge"
  const variantClass = variant === "outline" ? "badge-outline" : "badge-secondary"

  const combinedClassName = [baseClass, variantClass, className].filter(Boolean).join(" ")

  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  )
}

export { Badge }
