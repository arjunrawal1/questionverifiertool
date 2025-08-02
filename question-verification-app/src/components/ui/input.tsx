import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, ...props }, ref) => {
    const combinedClassName = ["input", className].filter(Boolean).join(" ")

    return <input type={type} className={combinedClassName} ref={ref} {...props} />
  }
)
Input.displayName = "Input"

export { Input }
