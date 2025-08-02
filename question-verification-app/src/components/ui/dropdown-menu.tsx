import React, { useState, useRef, useEffect } from "react"
import { cn } from "../../lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  onClick?: () => void
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: "start" | "center" | "end"
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface DropdownMenuCheckboxItemProps {
  children: React.ReactNode
  checked: boolean
  onCheckedChange: () => void
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ children, asChild, onClick }: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    setIsOpen(!isOpen)
    onClick?.()
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any)
  }

  return (
    <button onClick={handleClick} type="button">
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  children,
  align = "start",
  className,
}: DropdownMenuContentProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, setIsOpen])

  if (!isOpen) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 min-w-[200px] overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
      style={{ top: "100%", marginTop: "4px" }}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({ children, className, onClick }: DropdownMenuItemProps) {
  const { setIsOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    onClick?.()
    setIsOpen(false)
  }

  return (
    <div
      className={cn(
        "cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-gray-100 transition-colors",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

export function DropdownMenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
}: DropdownMenuCheckboxItemProps) {
  return (
    <div
      className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
      onClick={onCheckedChange}
    >
      <div
        className={cn(
          "w-4 h-4 border border-gray-300 rounded flex items-center justify-center",
          checked && "bg-blue-500 border-blue-500"
        )}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
