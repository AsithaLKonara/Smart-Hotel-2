"use client"

import { motion } from 'framer-motion'
import { Star, Shield, Award, Clock, Users, CheckCircle } from 'lucide-react'

interface TrustBadgeProps {
  icon: React.ReactNode
  label: string
  value?: string
  className?: string
}

function TrustBadge({ icon, label, value, className = '' }: TrustBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-2 text-white/90 hover:text-white transition-colors ${className}`}
    >
      <div className="flex items-center gap-1">
        {icon}
      </div>
      <span className="text-sm font-medium">
        {label}
        {value && <span className="ml-1 text-xs opacity-80">({value})</span>}
      </span>
    </motion.div>
  )
}

interface TrustBadgesProps {
  variant?: 'hero' | 'card' | 'inline'
  badges?: Array<{
    icon: React.ReactNode
    label: string
    value?: string
  }>
  className?: string
}

export function TrustBadges({ 
  variant = 'hero', 
  badges,
  className = '' 
}: TrustBadgesProps) {
  
  const defaultBadges = [
    {
      icon: <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />,
      label: "4.8/5 Rating",
      value: "2,500+ reviews"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Secure Booking"
    },
    {
      icon: <Award className="w-5 h-5" />,
      label: "Award Winning"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "24/7 Support"
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "10,000+ Guests"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      label: "Verified Reviews"
    }
  ]

  const displayBadges = badges || defaultBadges

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className={`flex items-center gap-8 flex-wrap justify-center ${className}`}
      >
        {displayBadges.slice(0, 3).map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
          >
            <TrustBadge {...badge} />
          </motion.div>
        ))}
      </motion.div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Why Choose Us</h3>
        <div className="grid grid-cols-2 gap-4">
          {displayBadges.slice(0, 4).map((badge, index) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                {badge.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{badge.label}</div>
                {badge.value && (
                  <div className="text-xs text-gray-500">{badge.value}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-6 flex-wrap ${className}`}>
        {displayBadges.slice(0, 4).map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className="text-amber-500">
              {badge.icon}
            </div>
            <span className="text-sm font-medium">{badge.label}</span>
          </motion.div>
        ))}
      </div>
    )
  }

  return null
}

export function TrustBadgeGrid({ 
  badges,
  className = '' 
}: {
  badges?: Array<{
    icon: React.ReactNode
    label: string
    value?: string
  }>
  className?: string
}) {
  const defaultBadges = [
    {
      icon: <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />,
      label: "Premium Quality",
      value: "5-star rated service"
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-500" />,
      label: "Secure & Safe",
      value: "SSL encrypted booking"
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-500" />,
      label: "Instant Confirmation",
      value: "Book now, stay today"
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      label: "Best Price Guarantee",
      value: "Lowest rates guaranteed"
    }
  ]

  const displayBadges = badges || defaultBadges

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
      {displayBadges.map((badge, index) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="text-center p-4 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-300"
        >
          <div className="flex justify-center mb-3">
            {badge.icon}
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">{badge.label}</h4>
          {badge.value && (
            <p className="text-sm text-gray-600">{badge.value}</p>
          )}
        </motion.div>
      ))}
    </div>
  )
}

export function FloatingTrustBadge({ 
  badge,
  position = 'bottom-right',
  className = ''
}: {
  badge: {
    icon: React.ReactNode
    label: string
    value?: string
  }
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 1 }}
      className={`fixed ${positionClasses[position]} z-50 ${className}`}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {badge.icon}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{badge.label}</div>
            {badge.value && (
              <div className="text-xs text-gray-500">{badge.value}</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { Star, Shield, Award, Clock, Users, CheckCircle } from 'lucide-react'

interface TrustBadgeProps {
  icon: React.ReactNode
  label: string
  value?: string
  className?: string
}

function TrustBadge({ icon, label, value, className = '' }: TrustBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-2 text-white/90 hover:text-white transition-colors ${className}`}
    >
      <div className="flex items-center gap-1">
        {icon}
      </div>
      <span className="text-sm font-medium">
        {label}
        {value && <span className="ml-1 text-xs opacity-80">({value})</span>}
      </span>
    </motion.div>
  )
}

interface TrustBadgesProps {
  variant?: 'hero' | 'card' | 'inline'
  badges?: Array<{
    icon: React.ReactNode
    label: string
    value?: string
  }>
  className?: string
}

export function TrustBadges({ 
  variant = 'hero', 
  badges,
  className = '' 
}: TrustBadgesProps) {
  
  const defaultBadges = [
    {
      icon: <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />,
      label: "4.8/5 Rating",
      value: "2,500+ reviews"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Secure Booking"
    },
    {
      icon: <Award className="w-5 h-5" />,
      label: "Award Winning"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "24/7 Support"
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "10,000+ Guests"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      label: "Verified Reviews"
    }
  ]

  const displayBadges = badges || defaultBadges

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className={`flex items-center gap-8 flex-wrap justify-center ${className}`}
      >
        {displayBadges.slice(0, 3).map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
          >
            <TrustBadge {...badge} />
          </motion.div>
        ))}
      </motion.div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Why Choose Us</h3>
        <div className="grid grid-cols-2 gap-4">
          {displayBadges.slice(0, 4).map((badge, index) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                {badge.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{badge.label}</div>
                {badge.value && (
                  <div className="text-xs text-gray-500">{badge.value}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-6 flex-wrap ${className}`}>
        {displayBadges.slice(0, 4).map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className="text-amber-500">
              {badge.icon}
            </div>
            <span className="text-sm font-medium">{badge.label}</span>
          </motion.div>
        ))}
      </div>
    )
  }

  return null
}

export function TrustBadgeGrid({ 
  badges,
  className = '' 
}: {
  badges?: Array<{
    icon: React.ReactNode
    label: string
    value?: string
  }>
  className?: string
}) {
  const defaultBadges = [
    {
      icon: <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />,
      label: "Premium Quality",
      value: "5-star rated service"
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-500" />,
      label: "Secure & Safe",
      value: "SSL encrypted booking"
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-500" />,
      label: "Instant Confirmation",
      value: "Book now, stay today"
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      label: "Best Price Guarantee",
      value: "Lowest rates guaranteed"
    }
  ]

  const displayBadges = badges || defaultBadges

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
      {displayBadges.map((badge, index) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="text-center p-4 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-300"
        >
          <div className="flex justify-center mb-3">
            {badge.icon}
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">{badge.label}</h4>
          {badge.value && (
            <p className="text-sm text-gray-600">{badge.value}</p>
          )}
        </motion.div>
      ))}
    </div>
  )
}

export function FloatingTrustBadge({ 
  badge,
  position = 'bottom-right',
  className = ''
}: {
  badge: {
    icon: React.ReactNode
    label: string
    value?: string
  }
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 1 }}
      className={`fixed ${positionClasses[position]} z-50 ${className}`}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {badge.icon}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{badge.label}</div>
            {badge.value && (
              <div className="text-xs text-gray-500">{badge.value}</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { Star, Shield, Award, Clock, Users, CheckCircle } from 'lucide-react'

interface TrustBadgeProps {
  icon: React.ReactNode
  label: string
  value?: string
  className?: string
}

function TrustBadge({ icon, label, value, className = '' }: TrustBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-2 text-white/90 hover:text-white transition-colors ${className}`}
    >
      <div className="flex items-center gap-1">
        {icon}
      </div>
      <span className="text-sm font-medium">
        {label}
        {value && <span className="ml-1 text-xs opacity-80">({value})</span>}
      </span>
    </motion.div>
  )
}

interface TrustBadgesProps {
  variant?: 'hero' | 'card' | 'inline'
  badges?: Array<{
    icon: React.ReactNode
    label: string
    value?: string
  }>
  className?: string
}

export function TrustBadges({ 
  variant = 'hero', 
  badges,
  className = '' 
}: TrustBadgesProps) {
  
  const defaultBadges = [
    {
      icon: <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />,
      label: "4.8/5 Rating",
      value: "2,500+ reviews"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Secure Booking"
    },
    {
      icon: <Award className="w-5 h-5" />,
      label: "Award Winning"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "24/7 Support"
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "10,000+ Guests"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      label: "Verified Reviews"
    }
  ]

  const displayBadges = badges || defaultBadges

  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className={`flex items-center gap-8 flex-wrap justify-center ${className}`}
      >
        {displayBadges.slice(0, 3).map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
          >
            <TrustBadge {...badge} />
          </motion.div>
        ))}
      </motion.div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Why Choose Us</h3>
        <div className="grid grid-cols-2 gap-4">
          {displayBadges.slice(0, 4).map((badge, index) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                {badge.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{badge.label}</div>
                {badge.value && (
                  <div className="text-xs text-gray-500">{badge.value}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-6 flex-wrap ${className}`}>
        {displayBadges.slice(0, 4).map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className="text-amber-500">
              {badge.icon}
            </div>
            <span className="text-sm font-medium">{badge.label}</span>
          </motion.div>
        ))}
      </div>
    )
  }

  return null
}

export function TrustBadgeGrid({ 
  badges,
  className = '' 
}: {
  badges?: Array<{
    icon: React.ReactNode
    label: string
    value?: string
  }>
  className?: string
}) {
  const defaultBadges = [
    {
      icon: <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />,
      label: "Premium Quality",
      value: "5-star rated service"
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-500" />,
      label: "Secure & Safe",
      value: "SSL encrypted booking"
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-500" />,
      label: "Instant Confirmation",
      value: "Book now, stay today"
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-green-500" />,
      label: "Best Price Guarantee",
      value: "Lowest rates guaranteed"
    }
  ]

  const displayBadges = badges || defaultBadges

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
      {displayBadges.map((badge, index) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="text-center p-4 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-300"
        >
          <div className="flex justify-center mb-3">
            {badge.icon}
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">{badge.label}</h4>
          {badge.value && (
            <p className="text-sm text-gray-600">{badge.value}</p>
          )}
        </motion.div>
      ))}
    </div>
  )
}

export function FloatingTrustBadge({ 
  badge,
  position = 'bottom-right',
  className = ''
}: {
  badge: {
    icon: React.ReactNode
    label: string
    value?: string
  }
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 1 }}
      className={`fixed ${positionClasses[position]} z-50 ${className}`}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {badge.icon}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{badge.label}</div>
            {badge.value && (
              <div className="text-xs text-gray-500">{badge.value}</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
