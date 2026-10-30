"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface ThemeToggleProps {
  className?: string
  id?: string
}

export function ThemeToggle({ className = "", id = "theme-toggle-btn" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div 
        className={`w-8 h-8 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/40 animate-pulse border border-transparent ${className}`} 
        aria-hidden="true"
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <button
      type="button"
      id={id}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Current: ${isDark ? "Dark Mode" : "Light Mode"} (Click to switch)`}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200
        border-zinc-200 dark:border-[#22262B]
        bg-zinc-100 hover:bg-zinc-200 dark:bg-[#121417] dark:hover:bg-[#181A1D]
        text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white
        focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${className}`}
    >
      <Sun 
        className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500 stroke-[2.2]" 
      />
      <Moon 
        className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-sky-400 stroke-[2.2]" 
      />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
