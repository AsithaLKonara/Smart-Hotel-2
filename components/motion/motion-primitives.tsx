"use client"

import { motion, MotionProps } from "framer-motion"
import { ReactNode } from "react"
import { motionVariants } from "@/lib/design-tokens"

// Base motion components for consistent animations
interface BaseMotionProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
}

export function FadeIn({ children, className, delay = 0, duration = 0.3 }: BaseMotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SlideUp({ children, className, delay = 0, duration = 0.3 }: BaseMotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SlideDown({ children, className, delay = 0, duration = 0.3 }: BaseMotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ScalePop({ children, className, delay = 0, duration = 0.2 }: BaseMotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration, ease: 'cubic-bezier(.22,1,.36,1)' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger animation for lists
interface StaggerProps extends BaseMotionProps {
  staggerDelay?: number
}

export function StaggerIn({ children, className, staggerDelay = 0.05 }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Hover animations
interface HoverProps extends BaseMotionProps {
  scale?: number
  rotate?: number
  y?: number
}

export function HoverScale({ children, className, scale = 1.05, y = -2 }: HoverProps) {
  return (
    <motion.div
      whileHover={{ scale, y }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function HoverLift({ children, className, y = -4 }: HoverProps) {
  return (
    <motion.div
      whileHover={{ y }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Page transition components
export function PageTransition({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Loading animations
export function Pulse({ children, className }: BaseMotionProps) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function Bounce({ children, className }: BaseMotionProps) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Progress animations
export function ProgressBar({ progress, className }: { progress: number, className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-full bg-amber-500"
      />
    </div>
  )
}

// Count up animation
export function CountUp({ 
  value, 
  duration = 1, 
  className 
}: { 
  value: number
  duration?: number
  className?: string 
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration, ease: 'easeOut' }}
      >
        {value.toLocaleString()}
      </motion.span>
    </motion.span>
  )
}

// Floating animation
export function Float({ children, className }: BaseMotionProps) {
  return (
    <motion.div
      animate={{ 
        y: [0, -10, 0],
        rotate: [0, 1, -1, 0]
      }}
      transition={{ 
        duration: 3, 
        repeat: Infinity, 
        ease: 'easeInOut' 
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Shake animation for errors
export function Shake({ children, className, trigger }: { 
  children: ReactNode
  className?: string
  trigger?: boolean
}) {
  return (
    <motion.div
      animate={trigger ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Typewriter effect
export function Typewriter({ 
  text, 
  speed = 50, 
  className 
}: { 
  text: string
  speed?: number
  className?: string 
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * (speed / 1000) }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  )
}

// Morphing animation
export function Morph({ 
  children, 
  className, 
  morphTo 
}: { 
  children: ReactNode
  className?: string
  morphTo?: ReactNode
}) {
  return (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Parallax scroll effect
export function ParallaxScroll({ 
  children, 
  offset = 50, 
  className 
}: { 
  children: ReactNode
  offset?: number
  className?: string 
}) {
  return (
    <motion.div
      style={{ y: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

