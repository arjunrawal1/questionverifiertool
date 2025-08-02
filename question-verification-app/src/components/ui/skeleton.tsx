import * as React from "react"

function Skeleton({ className = "", style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const combinedClassName = ["skeleton", className].filter(Boolean).join(" ")

  return <div className={combinedClassName} style={{ height: "1rem", ...style }} {...props} />
}

export { Skeleton }
